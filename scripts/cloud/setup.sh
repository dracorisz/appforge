#!/usr/bin/env bash
set -euo pipefail
# Run from repo root in authenticated Cloud Shell. No resources change without --apply.
: "${PROJECT_ID:?Set PROJECT_ID to the confirmed Google Cloud experiment project}"
REGION="${REGION:-us-central1}"
SERVICE=appforge-cloud-worker
WORKER_BUCKET="${PROJECT_ID}-appforge-experiments"
RUNTIME_SA="appforge-worker@${PROJECT_ID}.iam.gserviceaccount.com"
BUILD_SA="appforge-worker-build@${PROJECT_ID}.iam.gserviceaccount.com"
if [[ "${1:-}" != '--apply' ]]; then
  cat <<PLAN
Project: $PROJECT_ID / Region: $REGION
Private service: $SERVICE; zero idle instances, maximum 1, concurrency 1.
Runtime identity: $RUNTIME_SA (Vertex AI User, Datastore User, bucket Creator/Viewer).
Build identity: $BUILD_SA (Cloud Run Builder).
Private bucket: $WORKER_BUCKET; experiment objects expire after 7 days.
Firestore: existing default Native database, or create one in $REGION.
Daily application reservations: 400 cents; account-wide target: 500 cents.
Initial WORKER_ENABLED=false. No API keys or service-account JSON files.
Run bash scripts/cloud/setup.sh --apply after confirming project billing, IAM and model access.
PLAN
  exit 0
fi
command -v gcloud >/dev/null
[[ "$PROJECT_ID" =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ ]] || { echo 'Invalid project ID'; exit 1; }
gcloud projects describe "$PROJECT_ID" --format='value(projectId)'
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com aiplatform.googleapis.com firestore.googleapis.com storage.googleapis.com --project="$PROJECT_ID"
for account in appforge-worker appforge-worker-build; do
  if ! gcloud iam service-accounts describe "${account}@${PROJECT_ID}.iam.gserviceaccount.com" --project="$PROJECT_ID" >/dev/null 2>&1; then
    gcloud iam service-accounts create "$account" --project="$PROJECT_ID"
  fi
done
for role in roles/aiplatform.user roles/datastore.user; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$RUNTIME_SA" --role="$role" --condition=None >/dev/null
done
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$BUILD_SA" --role=roles/run.builder --condition=None >/dev/null
if ! gcloud firestore databases describe --database='(default)' --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud firestore databases create --database='(default)' --location="$REGION" --type=firestore-native --project="$PROJECT_ID"
fi
DB_TYPE=$(gcloud firestore databases describe --database='(default)' --project="$PROJECT_ID" --format='value(type)')
[[ "$DB_TYPE" == FIRESTORE_NATIVE ]] || { echo 'Default database must use Native mode; choose a dedicated experiment project.'; exit 1; }
if ! gcloud storage buckets describe "gs://$WORKER_BUCKET" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://$WORKER_BUCKET" --project="$PROJECT_ID" --location="$REGION" --uniform-bucket-level-access --public-access-prevention
fi
# Only use this dedicated disposable bucket. Never point this policy at production uploads.
gcloud storage buckets update "gs://$WORKER_BUCKET" --public-access-prevention --lifecycle-file=scripts/cloud/lifecycle.json
for role in roles/storage.objectCreator roles/storage.objectViewer; do
  gcloud storage buckets add-iam-policy-binding "gs://$WORKER_BUCKET" --member="serviceAccount:$RUNTIME_SA" --role="$role" >/dev/null
done
gcloud run deploy "$SERVICE" --project="$PROJECT_ID" --region="$REGION" \
  --source=services/cloud-worker --build-service-account="projects/$PROJECT_ID/serviceAccounts/$BUILD_SA" \
  --service-account="$RUNTIME_SA" --no-allow-unauthenticated --invoker-iam-check \
  --min=0 --max=1 --concurrency=1 --cpu=1 --memory=512Mi --timeout=90 --cpu-throttling \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,WORKER_BUCKET=$WORKER_BUCKET,WORKER_ENABLED=false"
gcloud run services describe "$SERVICE" --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)'
echo 'Deployed with experiments disabled. Follow docs/CLOUD-EXPERIMENTS.md to verify IAM/budget, enable and smoke-test.'
