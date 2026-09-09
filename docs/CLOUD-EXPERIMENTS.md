# Google Cloud experiments: $5/day operating target

Status: implementation and deployment scripts prepared; no Google Cloud resources
have been created by this change. The account, credit expiry, project ID, model
access and reported $5/day cap still need verification in the authenticated console.

## Architecture and boundaries

`services/cloud-worker` is a private Cloud Run service for operator experiments.
Cloud Run IAM authenticates callers; the service uses its attached service account
and Application Default Credentials to call Google's Vertex AI/Agent Platform API.
No AI Studio API key, downloadable service-account key, public bucket or public
worker endpoint is needed. Only trusted operators receive `roles/run.invoker`.

The existing website and personal Gemini fallback stay on Vercel. This worker is
not yet connected to public Story Studio requests. That integration requires
Vercel-to-Google workload identity federation plus authenticated per-user quotas,
job ownership checks, an image job polling UI and a reviewed asset-persistence
path. Do not expose this operator-only worker directly to browsers to skip that work.

## What is implemented

| Job | Result | Model/processor | Daily maximum | Reservation per attempt |
|---|---|---|---:|---:|
| `story` | Private UTF-8 text file | `gemini-2.5-flash-lite` | 50 | $0.02 |
| `image` | Private WebP, up to 1024 px | `gemini-3.1-flash-image`, one 1K output | 5 | $0.50 |
| `thumbnail` | Private WebP, up to 512 px | Sharp, CPU only | 25 | $0.02 |

Models, resolution, output-token limits and counts are server-controlled.
Prompts are limited to 6,000 UTF-8 bytes; thumbnail inputs to 2 MiB and 20M pixels.
Only a named object in this service's private `inputs/` bucket prefix is accepted;
no arbitrary URLs or external bucket reads. EXIF metadata is stripped on output.

The Firestore transaction reserves allowance before each paid attempt. Total
reservations stop at $4/day UTC, shared across revisions and restarts. Stable job
IDs prevent duplicates. Failed/unknown requests retain reservations because Google
may have processed and billed a timed-out call. There are no automatic generation
retries. Inspect an existing job instead of generating a new ID after a timeout.

**Reservations are conservative application allowances, not Google's billing
meter or a guaranteed account-wide $5 hard cap.** Cloud Run, builds, storage,
Firestore, egress, other apps and direct Studio calls are outside that ledger.
The $1 difference is headroom, not a guarantee. The Cloud budget remains necessary.

Cloud Run deploy defaults: zero minimum instances, one maximum instance,
concurrency 1, 1 CPU, 512 MiB, request-based CPU allocation and 90-second timeout.
The initial deployment has `WORKER_ENABLED=false`. A maximum instance setting is
not a dollar cap. Start with one image and one story, then inspect gross costs.

## 1. Verify the Cloud account first

In Google Cloud Console select the project covered by the welcome-credit billing
account. Prefer a dedicated experiment project on that account so the worker's
Firestore role cannot reach unrelated app data. Record the exact project ID,
billing account, remaining credits and expiry date; do not paste secrets into chat.

Open Billing → Budgets & alerts and inspect your $5/day setting. Verify whether
it is an alert, service quota, automation or actual spend cap, and which services
it covers. Google's native spend-cap preview currently supports monthly periods,
one project and one eligible service per cap. Do not assume a $5 alert stops calls.
Do not increase/disable the user's limit, upgrade billing or change credit terms.

Keep budget alerts based on gross usage (before promotional credits) so credit use
is visible. Direct Studio experiments also count toward the $5/day target even
though they bypass the worker's ledger. Start without GPU VMs, Veo/video generation,
provisioned throughput, dedicated model endpoints, training or always-on notebooks.

## 2. Review and deploy from Cloud Shell

Use this repository checkout containing the worker files. Cloud Shell supplies
gcloud and your interactive Google identity. Confirm the project instead of
assuming it is `wild-dragons` from an older OAuth setup.

```bash
export PROJECT_ID='YOUR_CONFIRMED_PROJECT_ID'
export REGION='us-central1'
bash scripts/cloud/setup.sh
```

The default command only prints a plan. Read it, then apply the reviewed plan:

```bash
bash scripts/cloud/setup.sh --apply
```

The script enables Cloud Run, Cloud Build, Artifact Registry, Vertex AI, Firestore
and Storage APIs. It creates separate runtime/build service accounts. Runtime gets
Vertex AI User and Datastore User on the experiment project and Object Creator /
Viewer only on the dedicated bucket. Builder gets Cloud Run Builder. The deployer
must be permitted to enable APIs, create resources, manage the stated IAM bindings
and act as both service accounts. Do not grant Owner/Editor to a runtime identity
as a workaround for permission errors.

It creates a Native default Firestore database only if none exists, a private
`PROJECT_ID-appforge-experiments` bucket, and deploys the worker. The bucket has a
7-day deletion lifecycle for disposable inputs/outputs; copy any results you want
to keep to your durable project storage before expiry. Firestore job tombstones
are retained to prevent replay; they contain no prompts or image bytes.

Deployment builds and Artifact Registry storage can incur charges independently
of generation. Avoid repeatedly deploying to test prompts. Keep image cleanup
policies for old build artifacts in the release maintenance checklist.

## 3. Verify access and enable experiments

Inspect Cloud Run → appforge-cloud-worker → Security: require authentication,
Invoker IAM check enabled, no `allUsers` or `allAuthenticatedUsers` Invoker grant.
Inspect the runtime service account and scaling settings. Verify budget controls
before enabling paid calls. An operator with Cloud Run Invoker can call the API.

```bash
gcloud run services describe appforge-cloud-worker \
  --project="$PROJECT_ID" --region="$REGION"
gcloud run services get-iam-policy appforge-cloud-worker \
  --project="$PROJECT_ID" --region="$REGION"

# After the access/budget check:
gcloud run services update appforge-cloud-worker \
  --project="$PROJECT_ID" --region="$REGION" \
  --update-env-vars=WORKER_ENABLED=true
```

Use `--update-env-vars=WORKER_ENABLED=false` as the application kill switch.
Existing in-flight work can still complete. A failed ledger read/write prevents
new provider calls; do not disable Firestore checks to fix a permissions problem.

## 4. Run one story experiment

```bash
cat > /tmp/story-job.json <<'JSON'
{"id":"story-smoke-20260910-001","kind":"story","prompt":"Write a 70-word opening for an original fantasy story about a dragon beneath a river city. End with three concise choices. Preserve the protagonist's agency."}
JSON
bash scripts/cloud/experiment.sh /tmp/story-job.json
```

Response includes an authoritative private `gs://.../outputs/...txt` object. Read
it with `gcloud storage cat` using that returned URI. Reusing the same ID returns
409 rather than spending again. Retrieve progress/output after a network error:

```bash
bash scripts/cloud/experiment.sh --status story-smoke-20260910-001
```

Try different prompts for Novel prose, Comics panel direction, summaries, app
copy, title/description drafts, translations and structured planning. The endpoint
returns plain text; validate generated JSON yourself if a prompt requests JSON.
Nothing is automatically posted to YouTube or another publishing service.

## 5. Run one image experiment

```bash
cat > /tmp/image-job.json <<'JSON'
{"id":"image-smoke-20260910-001","kind":"image","prompt":"Create one square fantasy book-cover illustration, no text: a small copper dragon above a moonlit river city, indigo shadows and warm amber lights, clear silhouette, original fictional setting."}
JSON
bash scripts/cloud/experiment.sh /tmp/image-job.json
```

Download the returned private object with `gcloud storage cp`. Keep tests to 1K
and five attempts/day initially. No image returned (e.g. safety filtering) is a
failed job, not a successful empty asset. Image rendering is billed even if a
later storage write fails, so the reservation remains consumed.

Google's current guide retires Imagen and directs users to Gemini Image. Do not
follow older Imagen tutorials blindly. Gemini 3.1 Flash Image's listed 1K image
output cost is $0.067 plus applicable input/text/thinking charges; the $0.50 job
reservation is intentionally higher and must be reviewed when model pricing changes.
Gemini 2.5 Flash-Lite's published retirement is October 20, 2026: evaluate its
replacement before that date and update the policy plus pricing assumptions.

## 6. Run one media worker job

Upload a non-sensitive test PNG/JPEG/WebP under 2 MiB to the returned dedicated
bucket at `inputs/sample.png`, with the correct image Content-Type. Then:

```bash
cat > /tmp/thumbnail-job.json <<'JSON'
{"id":"thumb-smoke-20260910-001","kind":"thumbnail","inputObject":"inputs/sample.png"}
JSON
bash scripts/cloud/experiment.sh /tmp/thumbnail-job.json
```

This verifies storage permissions and CPU processing without another model call.
The first version is a synchronous bounded worker, not a durable video queue.
A killed process may leave a `running` job; inspect logs/output before retrying.
Long video transcoding, transcription, embeddings, BigQuery dashboards and
scheduled jobs are later tasks, not services silently provisioned by this setup.

## Production gate

Before connecting Story Studio: real Cloud deployment/IAM check, model availability
check, one story/image/thumbnail success, duplicate-job protection verified on real
Firestore, anonymous request rejection, cost observation, per-user authorization,
private asset persistence and frontend refresh/export smoke tests. The repository
unit tests do not substitute for these authenticated production checks.

## Official references (checked 2026-09-10)

- https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps
- https://docs.cloud.google.com/billing/docs/how-to/budgets
- https://docs.cloud.google.com/run/docs/configuring/max-instances
- https://docs.cloud.google.com/run/docs/configuring/services/build-service-account
- https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start
- https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-1-flash-image
- https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing
- https://firebase.google.com/docs/ai-logic/imagen-models-migration
- https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/2-5-flash-lite
