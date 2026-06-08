#!/usr/bin/env bash
set -euo pipefail

# Create secrets in OCI Vault for FinSight
: "${COMPARTMENT_OCID:?COMPARTMENT_OCID is required}"
: "${VAULT_OCID:?VAULT_OCID is required}"
: "${KEY_OCID:?KEY_OCID is required}"

: "${JWT_SECRET:?JWT_SECRET is required}"
: "${JWT_REFRESH_SECRET:?JWT_REFRESH_SECRET is required}"
: "${NEXTAUTH_SECRET:?NEXTAUTH_SECRET is required}"
: "${MONGODB_URI:?MONGODB_URI is required}"

create_secret() {
    local name="$1"
    local value="$2"
    local encoded
    encoded=$(echo -n "${value}" | base64)

    echo "Creating secret: ${name}"
    oci vault secret create-base64 \
        --compartment-id "${COMPARTMENT_OCID}" \
        --vault-id "${VAULT_OCID}" \
        --key-id "${KEY_OCID}" \
        --secret-name "${name}" \
        --secret-content-content "${encoded}" \
        --description "FinSight ${name}" 2>/dev/null || \
    echo "Secret ${name} may already exist. Update manually if needed."
}

create_secret "finsight-jwt-secret" "${JWT_SECRET}"
create_secret "finsight-jwt-refresh-secret" "${JWT_REFRESH_SECRET}"
create_secret "finsight-nextauth-secret" "${NEXTAUTH_SECRET}"
create_secret "finsight-mongodb-uri" "${MONGODB_URI}"

echo "==> All secrets configured."
