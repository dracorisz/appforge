# Desktop Buddy

Desktop Buddy is AppForge's local-first dragon character companion at `/apps/desktop-buddy`.

## Current beta

The current beta covers the local character loop, a server-side Hugging Face generator, and a production-ready secure Vertex bridge that remains disabled until the deployment IAM/environment values are configured.

- Start from KDE Community Konqi/Katie artwork or upload PNG, JPEG, WebP, or SVG artwork.
- Browse an expanded KDE Community library of source-linked mascot poses with author/license metadata.
- Keep the active character configuration in browser storage.
- Adjust character scale and horizontal/vertical framing.
- Export/import versioned `.buddy.json` packs with provenance.
- Export a transparent 512 × 512 PNG when the source permits browser canvas access.
- Create local 128, 256 and 512 px transparent PNG variants plus WebP alternatives.
- Explicitly generate an original character through Hugging Face or, when configured, Vertex AI.
- Preview, download, or apply generated artwork to the floating Buddy.
- Select browser voices, Speak/Stop, and optionally auto-speak AppForge response events.
- Keep the configured buddy visible as an optional movable companion across authenticated AppForge routes.
- Use floating actions for Speak, Jump and user-authorized Screenshot capture to Media Vault → Screenshots.

## KDE starter artwork

Desktop Buddy uses KDE dragon artwork as the default starting point. The app exposes a broader KDE Community library including classic Konqi, KDE development, Developer Katie, graphics, hardware, internet, presentation, science, system, utilities, Frameworks, Qt, Akademy, carrying/box poses, Pixel Konqi and group artwork.

Library entries use KDE Community file redirects rather than silently copying upstream originals into the AppForge repository. Every entry keeps a source page, author/project label and license label. The local optimizer is the preferred normalization path for creating AppForge-sized derivatives while preserving provenance.

## Local asset optimizer

The optimizer runs entirely in the browser and consumes no Hugging Face or Google Cloud credits. A source image can be fitted into transparent square canvases at 128, 256 and 512 pixels. Each PNG is downloadable; WebP alternatives are offered where supported. The 512 px PNG can become the active buddy immediately.

The optimizer rejects oversized source bytes/dimensions that could exhaust browser memory. This is local preparation/export, not an automatic cloud upload.

## Hugging Face generation

`/api/desktop-buddy-image` is an authenticated, explicit-action endpoint. It uses the shared AppForge Hugging Face provider adapter in `api/_hf-image-provider.js`, including server-side token rotation, optional personal tokens, live provider mapping, bounded timeouts, model fallback, MIME validation and sanitized provider diagnostics.

Shared-token generation uses the existing AppForge daily image-turn allowance and refunds that allowance when provider generation fails. Personal-token generation does not consume the shared allowance. Nothing runs automatically or in the background.

## Secure Vertex AI bridge

Desktop Buddy no longer needs a browser-to-Cloud-Run shortcut. The bridge is implemented as:

`browser → authenticated Vercel API → Vercel OIDC → Google Workload Identity Federation → short-lived bridge service-account credentials → IAM-protected Cloud Run → private Cloud Storage output → authenticated Vercel API → browser`

The implementation is split across:

- `api/_gcp-cloud-run.js` — exchanges the Vercel OIDC assertion at Google STS, mints short-lived service-account access/ID tokens, invokes the private Cloud Run worker, and retrieves only expected private `outputs/*` image objects.
- `api/desktop-buddy-vertex.js` — authenticates the Supabase user, enforces prompt bounds, creates/reuses owner-scoped jobs, calls the private worker, sanitizes failures and returns the completed image.
- `public.vertex_bridge_jobs` — owner-RLS job mapping. It stores no prompt and no credential. `(user_id, client_request_id)` is unique so browser/network retries cannot silently create a second paid image.
- `scripts/cloud/setup-vercel-bridge.sh` — plan/apply helper for a low-privilege bridge service account, Cloud Run Invoker, private bucket Object Viewer and the reviewed WIF principal binding.

The Vercel production environment requires these **server-only** values:

- `GCP_PROJECT_NUMBER`
- `GCP_SERVICE_ACCOUNT_EMAIL`
- `GCP_WORKLOAD_IDENTITY_POOL_ID`
- `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID`
- `GCP_CLOUD_WORKER_URL`
- `GCP_WORKER_BUCKET`

They must never use a `VITE_` prefix. AppForge does not need a downloadable Google service-account JSON key.

The Google WIF pool/provider itself must be reviewed against the actual Vercel production OIDC claims. The setup script intentionally refuses to invent or broadly grant that principal. `WIF_PRINCIPAL_SET` must identify the reviewed production principal before `--apply` is allowed.

The live Supabase project now includes the owner-scoped `vertex_bridge_jobs` migration. The remaining external activation steps are the real Google WIF/provider/IAM configuration and the six server-only Vercel environment values. Keep `WORKER_ENABLED=false` until billing and IAM are checked; enable it only for a deliberate smoke job.

### Vertex retry/recovery behavior

The browser creates one `clientRequestId` for a generation attempt. If Vercel or the browser times out, Desktop Buddy stores the returned bridge job ID and exposes **Recover Vertex job**. Recovery asks for the existing private Cloud Run job instead of creating another paid image request.

A completed private output is accepted only from the configured worker bucket under `outputs/`, must be PNG/JPEG/WebP, and must remain within the bridge response-size limit.

## Data boundary

User-uploaded artwork and local optimizer output remain browser-local unless the user explicitly invokes another upload action. KDE choices store remote source/provenance metadata. Buddy pack export copies the current configuration and provenance into the downloaded JSON.

Hugging Face and Vertex generation are explicit authenticated server calls. Personal provider tokens are never embedded into buddy packs. Google workload credentials are ephemeral server credentials and are never returned to the browser.

## Agent response bridge

Desktop Buddy listens for the shared `appforge:agent-response` event. Story Studio already emits successful narrative responses to this bridge, so the floating companion can react and optionally speak real model output. Additional AI surfaces should use the same helper as they are connected.

## Persistent companion

The authenticated AppForge layout mounts the floating Desktop Buddy outside the full editor. The widget loads the active character, has its own page-level switch, can be dragged and remember position, displays/speaks the latest agent response, jumps, and opens the browser-required tab/screen picker for Screenshot. Permitted screenshots upload to Media Vault under `Screenshots`.

Browsers do not permit silent screenshots, so capture always depends on explicit browser permission.

## Remaining milestones

- Create/review the actual Google Workload Identity Pool/provider for the production Vercel project and apply the least-privilege principal binding.
- Add the six server-only WIF/worker values to Vercel production and smoke one Vertex image while observing cost.
- Emit `appforge:agent-response` from additional AppForge AI surfaces.
- Add browser/E2E coverage for dragging, widget switches, generation error states, Vertex recovery and screenshot permission/cancellation.
- Add post-deploy screenshots and production smoke evidence.
- Continue optional KDE additions only when file-level provenance is traceable.

## Release policy

Only deploy a `main` commit after registry audit, lint, TypeScript, unit tests, production build and Cloud Run worker validation pass. Post-deploy smoke should cover KDE starter loading, custom upload, framing, packs, local optimization, Hugging Face status/generation, Vertex readiness/recovery, applying/downloading generated output, floating widget state/drag/actions, screenshot → Media Vault, and provider failure behavior.
