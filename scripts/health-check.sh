#!/usr/bin/env bash
set -euo pipefail

# Health check script for WealthWise API
URL="${1:-http://localhost:4000/api/health}"
TIMEOUT="${2:-5}"

echo "Checking health at ${URL}..."

HTTP_CODE=$(curl --silent --output /dev/null --write-out "%{http_code}" \
    --max-time "${TIMEOUT}" \
    "${URL}" 2>/dev/null) || {
    echo "FAIL: Could not connect to ${URL}" >&2
    exit 1
}

if [ "${HTTP_CODE}" -eq 200 ]; then
    echo "OK: Health check passed (HTTP ${HTTP_CODE})"
    exit 0
else
    echo "FAIL: Health check returned HTTP ${HTTP_CODE}" >&2
    exit 1
fi
