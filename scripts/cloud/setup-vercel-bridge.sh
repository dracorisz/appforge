#!/usr/bin/env bash
set -euo pipefail

APPLY=false
if [[ "${1:-}" == "--apply" ]]; then APPLY=true; fi

: "${PROJECT_ID:?Set PROJECT_ID to the confirmed Google Cloud project ID.}"
REGION="${REGION:-us-central1}"
WORKER_SERVICE="${WORKER_SERVICE:-appforge-cloud-worker}"
WORKER_BUCKET="${WORKER_BUCKET:-${PROJECT_ID}-appforge-experiments}"
BRIDGE_SA_NAME="${BRIDGE_SA_NAME:-appforge-vercel-bridge}"
WIF_PRINCIPAL_SET="${WIF_PRINCIPAL_SET:-}"

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
BRIDGE_SA_EMAIL="${BRIDGE_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
WORKER_URL="$(gcloud run services describe "$WORKER_SERVICE" --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)' 2>/dev/null || true)"

cat <<PLAN
AppForge Vercel → Google Cloud bridge plan
  project:       $PROJECT_ID ($PROJECT_NUMBER)
  region:        $REGION
  worker:        $WORKER_SERVICE
  worker URL:    ${WORKER_URL:-<worker not found yet>}
  worker bucket: $WORKER_BUCKET
  bridge SA:     $BRIDGE_SA_EMAIL

This script does NOT create or weaken the Workload Identity Pool/provider because
Vercel issuer/claim conditions must be reviewed for the actual production project.
Set WIF_PRINCIPAL_SET to the exact production-only principalSet from that reviewed
provider before --apply. No service-account key is created.
PLAN

if [[ "$APPLY" != true ]]; then
  cat <<'NEXT'

Plan only. After creating/reviewing the Vercel OIDC provider, run:
  export WIF_PRINCIPAL_SET='principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/attribute.YOUR_ATTRIBUTE/YOUR_VALUE'
  bash scripts/cloud/setup-vercel-bridge.sh --apply
NEXT
  exit 0
fi

if [[ -z "$WIF_PRINCIPAL_SET" ]]; then
  echo 'WIF_PRINCIPAL_SET is required for --apply; do not grant the entire pool by default.' >&2
  exit 2
fi
if [[ -z "$WORKER_URL" ]]; then
  echo 'Private Cloud Run worker was not found. Deploy/verify it before applying bridge IAM.' >&2
  exit 2
fi

# Required for federation and short-lived credentials.
gcloud services enable iamcredentials.googleapis.com sts.googleapis.com --project="$PROJECT_ID"

if ! gcloud iam service-accounts describe "$BRIDGE_SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$BRIDGE_SA_NAME" --project="$PROJECT_ID" --display-name='AppForge Vercel bridge'
fi

# Only this bridge identity can invoke the private worker.
gcloud run services add-iam-policy-binding "$WORKER_SERVICE" \
  --project="$PROJECT_ID" --region="$REGION" \
  --member="serviceAccount:${BRIDGE_SA_EMAIL}" \
  --role='roles/run.invoker'

# Bridge only needs to read completed private outputs, never list/write the bucket.
gcloud storage buckets add-iam-policy-binding "gs://${WORKER_BUCKET}" \
  --member="serviceAccount:${BRIDGE_SA_EMAIL}" \
  --role='roles/storage.objectViewer'

# The production-scoped Vercel federated principal may mint short-lived credentials
# for this one low-privilege bridge service account. No downloadable key is used.
gcloud iam service-accounts add-iam-policy-binding "$BRIDGE_SA_EMAIL" \
  --project="$PROJECT_ID" \
  --member="$WIF_PRINCIPAL_SET" \
  --role='roles/iam.workloadIdentityUser'

cat <<DONE

Bridge IAM applied. Add these SERVER-ONLY values to the Vercel production environment:
  GCP_PROJECT_NUMBER=$PROJECT_NUMBER
  GCP_SERVICE_ACCOUNT_EMAIL=$BRIDGE_SA_EMAIL
  GCP_WORKLOAD_IDENTITY_POOL_ID=<reviewed pool id>
  GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID=<reviewed provider id>
  GCP_CLOUD_WORKER_URL=$WORKER_URL
  GCP_WORKER_BUCKET=$WORKER_BUCKET

Then apply the latest Supabase migration for public.vertex_bridge_jobs and smoke the
Desktop Buddy Vertex status/generation/recovery path. Keep WORKER_ENABLED=false until
billing/IAM checks are complete; enable it only for the deliberate smoke test.
DONE
