#!/usr/bin/env bash
set -euo pipefail

# Populate Azure Key Vault secrets for WealthWise
: "${KEY_VAULT_NAME:?KEY_VAULT_NAME is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"
: "${JWT_REFRESH_SECRET:?JWT_REFRESH_SECRET is required}"
: "${NEXTAUTH_SECRET:?NEXTAUTH_SECRET is required}"
: "${MONGODB_URI:?MONGODB_URI is required}"

echo "==> Setting Key Vault secrets..."
az keyvault secret set --vault-name "${KEY_VAULT_NAME}" --name "jwt-secret" --value "${JWT_SECRET}"
az keyvault secret set --vault-name "${KEY_VAULT_NAME}" --name "jwt-refresh-secret" --value "${JWT_REFRESH_SECRET}"
az keyvault secret set --vault-name "${KEY_VAULT_NAME}" --name "nextauth-secret" --value "${NEXTAUTH_SECRET}"
az keyvault secret set --vault-name "${KEY_VAULT_NAME}" --name "mongodb-uri" --value "${MONGODB_URI}"

echo "==> All secrets configured in ${KEY_VAULT_NAME}."
