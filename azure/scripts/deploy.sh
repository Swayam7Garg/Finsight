#!/usr/bin/env bash
set -euo pipefail

# Deploy WealthWise to Azure Container Apps
: "${AZURE_SUBSCRIPTION_ID:?AZURE_SUBSCRIPTION_ID is required}"
: "${RESOURCE_GROUP:?RESOURCE_GROUP is required}"
: "${ACR_NAME:?ACR_NAME is required}"
: "${ENVIRONMENT:?ENVIRONMENT is required (dev|staging|production)}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
GIT_SHA=$(git -C "${REPO_ROOT}" rev-parse --short HEAD)
ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"

echo "==> Setting subscription..."
az account set --subscription "${AZURE_SUBSCRIPTION_ID}"

echo "==> Authenticating with ACR..."
az acr login --name "${ACR_NAME}"

echo "==> Building and pushing API image..."
docker build -f "${REPO_ROOT}/apps/api/Dockerfile.prod" \
    -t "${ACR_LOGIN_SERVER}/wealthwise-api:${GIT_SHA}" \
    -t "${ACR_LOGIN_SERVER}/wealthwise-api:latest" \
    "${REPO_ROOT}"
docker push "${ACR_LOGIN_SERVER}/wealthwise-api:${GIT_SHA}"
docker push "${ACR_LOGIN_SERVER}/wealthwise-api:latest"

echo "==> Building and pushing Web image..."
docker build -f "${REPO_ROOT}/apps/web/Dockerfile.prod" \
    -t "${ACR_LOGIN_SERVER}/wealthwise-web:${GIT_SHA}" \
    -t "${ACR_LOGIN_SERVER}/wealthwise-web:latest" \
    "${REPO_ROOT}"
docker push "${ACR_LOGIN_SERVER}/wealthwise-web:${GIT_SHA}"
docker push "${ACR_LOGIN_SERVER}/wealthwise-web:latest"

echo "==> Deploying Bicep template..."
az deployment group create \
    --resource-group "${RESOURCE_GROUP}" \
    --template-file "${SCRIPT_DIR}/../bicep/main.bicep" \
    --parameters \
        environment="${ENVIRONMENT}" \
        apiImage="${ACR_LOGIN_SERVER}/wealthwise-api:${GIT_SHA}" \
        webImage="${ACR_LOGIN_SERVER}/wealthwise-web:${GIT_SHA}"

echo "==> Deployment complete!"
