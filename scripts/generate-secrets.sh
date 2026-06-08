#!/usr/bin/env bash
set -euo pipefail

# Generate cryptographic secrets for FinSight environment variables

if ! command -v openssl &> /dev/null; then
    echo "Error: openssl is required but not installed." >&2
    exit 1
fi

echo "# FinSight Generated Secrets"
echo "# Generated on $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""
echo "JWT_SECRET=$(openssl rand -base64 48)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 48)"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 48)"
