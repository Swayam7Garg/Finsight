#!/usr/bin/env bash
set -euo pipefail

# Build production Docker images for FinSight
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

GIT_SHA=$(git -C "${REPO_ROOT}" rev-parse --short HEAD 2>/dev/null || echo "latest")

echo "Building FinSight production images (${GIT_SHA})..."

echo ""
echo "==> Building API image..."
docker build \
    -f "${REPO_ROOT}/apps/api/Dockerfile.prod" \
    -t "finsight-api:${GIT_SHA}" \
    -t "finsight-api:latest" \
    "${REPO_ROOT}"

echo ""
echo "==> Building Web image..."
docker build \
    -f "${REPO_ROOT}/apps/web/Dockerfile.prod" \
    -t "finsight-web:${GIT_SHA}" \
    -t "finsight-web:latest" \
    "${REPO_ROOT}"

echo ""
echo "==> Building MCP image..."
docker build \
    -f "${REPO_ROOT}/mcp/Dockerfile.prod" \
    -t "finsight-mcp:${GIT_SHA}" \
    -t "finsight-mcp:latest" \
    "${REPO_ROOT}/mcp"

echo ""
echo "==> Building Agentic AI image..."
docker build \
    -f "${REPO_ROOT}/agentic-ai/Dockerfile.prod" \
    -t "finsight-agentic-ai:${GIT_SHA}" \
    -t "finsight-agentic-ai:latest" \
    "${REPO_ROOT}"

echo ""
echo "Build complete:"
echo "  finsight-api:${GIT_SHA}"
echo "  finsight-web:${GIT_SHA}"
echo "  finsight-mcp:${GIT_SHA}"
echo "  finsight-agentic-ai:${GIT_SHA}"
