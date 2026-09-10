#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT_ID:?Set PROJECT_ID}"
REGION="${REGION:-us-central1}"
WORKER_URL=$(gcloud run services describe appforge-cloud-worker --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')
[[ "$WORKER_URL" == https://*.run.app ]] || { echo 'Expected a Cloud Run service URL'; exit 1; }
# Supply a JSON file containing a stable unique id, kind and prompt/inputObject.
# Reuse the ID for status checks after a timeout; never blindly retry with a new ID.
if [[ "${1:-}" == '--status' ]]; then
  [[ "${2:-}" =~ ^[a-zA-Z0-9-]{16,64}$ ]] || { echo 'Invalid job ID'; exit 1; }
  curl --fail-with-body --max-time 20 -H "Authorization: Bearer $(gcloud auth print-identity-token)" "$WORKER_URL/v1/jobs/$2"
else
  : "${1:?Pass the path to a job JSON file, or --status JOB_ID}"
  curl --fail-with-body --max-time 100 -H "Authorization: Bearer $(gcloud auth print-identity-token)" -H 'Content-Type: application/json' --data-binary "@$1" "$WORKER_URL/v1/jobs"
fi
