#!/usr/bin/env bash
set -euo pipefail

# Deploy FinSight to OCI OKE
: "${OCI_REGION:?OCI_REGION is required}"
: "${OCIR_NAMESPACE:?OCIR_NAMESPACE is required}"
: "${CLUSTER_OCID:?CLUSTER_OCID is required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
GIT_SHA=$(git -C "${REPO_ROOT}" rev-parse --short HEAD)
OCIR_BASE="${OCI_REGION}.ocir.io/${OCIR_NAMESPACE}"

echo "==> Authenticating with OCIR..."
docker login "${OCI_REGION}.ocir.io" -u "${OCIR_NAMESPACE}/oracleidentitycloudservice/${OCI_USER}" --password-stdin <<< "${OCI_AUTH_TOKEN}"

echo "==> Building API image..."
docker build -f "${REPO_ROOT}/apps/api/Dockerfile.prod" \
    -t "${OCIR_BASE}/finsight-api:${GIT_SHA}" \
    -t "${OCIR_BASE}/finsight-api:latest" \
    "${REPO_ROOT}"

echo "==> Building Web image..."
docker build -f "${REPO_ROOT}/apps/web/Dockerfile.prod" \
    -t "${OCIR_BASE}/finsight-web:${GIT_SHA}" \
    -t "${OCIR_BASE}/finsight-web:latest" \
    "${REPO_ROOT}"

echo "==> Pushing images..."
docker push "${OCIR_BASE}/finsight-api:${GIT_SHA}"
docker push "${OCIR_BASE}/finsight-api:latest"
docker push "${OCIR_BASE}/finsight-web:${GIT_SHA}"
docker push "${OCIR_BASE}/finsight-web:latest"

echo "==> Configuring kubectl..."
oci ce cluster create-kubeconfig \
    --cluster-id "${CLUSTER_OCID}" \
    --file "$HOME/.kube/config" \
    --region "${OCI_REGION}" \
    --token-version 2.0.0

echo "==> Applying Kubernetes manifests..."
kubectl kustomize "${SCRIPT_DIR}/../k8s" | \
    sed "s|finsight-api:latest|${OCIR_BASE}/finsight-api:${GIT_SHA}|g" | \
    sed "s|finsight-web:latest|${OCIR_BASE}/finsight-web:${GIT_SHA}|g" | \
    kubectl apply -f -

echo "==> Waiting for rollout..."
kubectl -n finsight rollout status deployment/finsight-api --timeout=300s
kubectl -n finsight rollout status deployment/finsight-web --timeout=300s

echo "==> Deployment complete!"
