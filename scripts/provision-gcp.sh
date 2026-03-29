#!/usr/bin/env bash
set -euo pipefail

# ContractIQ v2 — GCP infrastructure provisioning
# Run once: bash scripts/provision-gcp.sh
# Prerequisites: gcloud CLI authenticated, PROJECT_ID set

PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID}"
REGION="europe-west1"
APP_NAME="contractiq-v2"

echo "=== ContractIQ v2 GCP Provisioning ==="
echo "Project: $PROJECT_ID | Region: $REGION"

# Enable required APIs
echo "--- Enabling APIs ---"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  vpcaccess.googleapis.com \
  --project="$PROJECT_ID"

# Artifact Registry
echo "--- Artifact Registry ---"
gcloud artifacts repositories create "$APP_NAME" \
  --repository-format=docker \
  --location="$REGION" \
  --project="$PROJECT_ID" || echo "Already exists"

# Cloud SQL (Postgres 15 + pgvector)
echo "--- Cloud SQL ---"
gcloud sql instances create "${APP_NAME}-db" \
  --database-version=POSTGRES_15 \
  --region="$REGION" \
  --tier=db-g1-small \
  --database-flags=cloudsql.enable_pgvector=on \
  --project="$PROJECT_ID" || echo "Already exists"

gcloud sql databases create contractiq \
  --instance="${APP_NAME}-db" \
  --project="$PROJECT_ID" || echo "Already exists"

# Cloud Memorystore (Redis 7)
echo "--- Memorystore Redis ---"
gcloud redis instances create "${APP_NAME}-redis" \
  --size=1 \
  --region="$REGION" \
  --redis-version=redis_7_0 \
  --project="$PROJECT_ID" || echo "Already exists"

# GCS bucket
echo "--- GCS Bucket ---"
gsutil mb -l "$REGION" -p "$PROJECT_ID" "gs://${APP_NAME}-documents" || echo "Already exists"
gsutil uniformbucketlevelaccess set on "gs://${APP_NAME}-documents"

# Serverless VPC connector (for Memorystore access from Cloud Run)
echo "--- VPC Connector ---"
gcloud compute networks vpc-access connectors create "${APP_NAME}-connector" \
  --region="$REGION" \
  --range="10.8.0.0/28" \
  --project="$PROJECT_ID" || echo "Already exists"

# Service accounts
echo "--- Service Accounts ---"
for SA in "api" "worker"; do
  gcloud iam service-accounts create "${APP_NAME}-${SA}" \
    --project="$PROJECT_ID" || echo "${SA} SA already exists"
done

# IAM bindings for API service account
API_SA="${APP_NAME}-api@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${API_SA}" \
  --role="roles/cloudsql.client"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${API_SA}" \
  --role="roles/storage.objectAdmin"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${API_SA}" \
  --role="roles/secretmanager.secretAccessor"

# IAM bindings for Worker service account (same as API)
WORKER_SA="${APP_NAME}-worker@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${WORKER_SA}" \
  --role="roles/cloudsql.client"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${WORKER_SA}" \
  --role="roles/storage.objectAdmin"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${WORKER_SA}" \
  --role="roles/secretmanager.secretAccessor"

# Secrets (placeholder — must be filled by operator)
echo "--- Secret Manager ---"
echo "IMPORTANT: Create these secrets manually with your actual values:"
echo "  gcloud secrets create anthropic-api-key --data-file=- <<< 'sk-ant-...'"
echo "  gcloud secrets create voyage-api-key --data-file=- <<< 'pa-...'"
echo "  python -c \"import secrets; print(secrets.token_urlsafe(64))\" | gcloud secrets create contractiq-secret-key --data-file=-"
echo "  (plus DATABASE_URL and REDIS_URL after instances are created)"

echo ""
echo "=== Provisioning complete ==="
echo "Next: Run Alembic migration, then push to trigger CI/CD deploy"
