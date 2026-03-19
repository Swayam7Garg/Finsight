#!/usr/bin/env bash
set -euo pipefail

# Initialize AWS Secrets Manager secrets for WealthWise
: "${AWS_REGION:?AWS_REGION is required}"

create_or_update_secret() {
    local name="$1"
    local value="$2"

    if aws secretsmanager describe-secret --secret-id "${name}" --region "${AWS_REGION}" &>/dev/null; then
        echo "Updating secret: ${name}"
        aws secretsmanager put-secret-value \
            --secret-id "${name}" \
            --secret-string "${value}" \
            --region "${AWS_REGION}"
    else
        echo "Creating secret: ${name}"
        aws secretsmanager create-secret \
            --name "${name}" \
            --secret-string "${value}" \
            --region "${AWS_REGION}"
    fi
}

: "${JWT_SECRET:?JWT_SECRET is required}"
: "${JWT_REFRESH_SECRET:?JWT_REFRESH_SECRET is required}"
: "${MONGODB_URI:?MONGODB_URI is required}"
: "${NEXTAUTH_SECRET:?NEXTAUTH_SECRET is required}"

create_or_update_secret "wealthwise/jwt-secret" "${JWT_SECRET}"
create_or_update_secret "wealthwise/jwt-refresh-secret" "${JWT_REFRESH_SECRET}"
create_or_update_secret "wealthwise/mongodb-uri" "${MONGODB_URI}"
create_or_update_secret "wealthwise/nextauth-secret" "${NEXTAUTH_SECRET}"

echo "All secrets configured."
