#!/usr/bin/env bash
set -euo pipefail

# Deploy FinSight to GCP Cloud Run
: "${PROJECT_ID:?PROJECT_ID is required}"
: "${REGION:=${GCP_REGION:-us-central1}}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
GIT_SHA=$(git -C "${REPO_ROOT}" rev-parse --short HEAD)
AR_BASE="${REGION}-docker.pkg.dev/${PROJECT_ID}"

echo "==> Configuring Docker for Artifact Registry..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

echo "==> Building API image..."
docker build -f "${REPO_ROOT}/apps/api/Dockerfile.prod" \
    -t "${AR_BASE}/finsight-api/api:${GIT_SHA}" \
    -t "${AR_BASE}/finsight-api/api:latest" \
    "${REPO_ROOT}"

echo "==> Building Web image..."
docker build -f "${REPO_ROOT}/apps/web/Dockerfile.prod" \
    -t "${AR_BASE}/finsight-web/web:${GIT_SHA}" \
    -t "${AR_BASE}/finsight-web/web:latest" \
    "${REPO_ROOT}"

echo "==> Pushing images..."
docker push "${AR_BASE}/finsight-api/api:${GIT_SHA}"
docker push "${AR_BASE}/finsight-api/api:latest"
docker push "${AR_BASE}/finsight-web/web:${GIT_SHA}"
docker push "${AR_BASE}/finsight-web/web:latest"

echo "==> Deploying API to Cloud Run..."
gcloud run deploy finsight-api \
    --image "${AR_BASE}/finsight-api/api:${GIT_SHA}" \
    --region "${REGION}" \
    --project "${PROJECT_ID}" \
    --quiet

echo "==> Deploying Web to Cloud Run..."
gcloud run deploy finsight-web \
    --image "${AR_BASE}/finsight-web/web:${GIT_SHA}" \
    --region "${REGION}" \
    --project "${PROJECT_ID}" \
    --quiet

echo "==> Deployment complete!"
