#!/usr/bin/env bash
set -euo pipefail

# Deploy WealthWise to AWS ECS
# Requires: AWS_ACCOUNT_ID, AWS_REGION environment variables

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

: "${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID is required}"
: "${AWS_REGION:?AWS_REGION is required}"

ECR_BASE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
GIT_SHA=$(git -C "${REPO_ROOT}" rev-parse --short HEAD)

echo "==> Authenticating with ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | \
    docker login --username AWS --password-stdin "${ECR_BASE}"

echo "==> Building API image..."
docker build -f "${REPO_ROOT}/apps/api/Dockerfile.prod" \
    -t "${ECR_BASE}/wealthwise-api:${GIT_SHA}" \
    -t "${ECR_BASE}/wealthwise-api:latest" \
    "${REPO_ROOT}"

echo "==> Building Web image..."
docker build -f "${REPO_ROOT}/apps/web/Dockerfile.prod" \
    -t "${ECR_BASE}/wealthwise-web:${GIT_SHA}" \
    -t "${ECR_BASE}/wealthwise-web:latest" \
    "${REPO_ROOT}"

echo "==> Pushing images..."
docker push "${ECR_BASE}/wealthwise-api:${GIT_SHA}"
docker push "${ECR_BASE}/wealthwise-api:latest"
docker push "${ECR_BASE}/wealthwise-web:${GIT_SHA}"
docker push "${ECR_BASE}/wealthwise-web:latest"

echo "==> Updating ECS services..."
aws ecs update-service \
    --cluster wealthwise \
    --service wealthwise-api \
    --force-new-deployment \
    --region "${AWS_REGION}"

aws ecs update-service \
    --cluster wealthwise \
    --service wealthwise-web \
    --force-new-deployment \
    --region "${AWS_REGION}"

echo "==> Waiting for services to stabilize..."
aws ecs wait services-stable \
    --cluster wealthwise \
    --services wealthwise-api wealthwise-web \
    --region "${AWS_REGION}"

echo "==> Deployment complete!"
