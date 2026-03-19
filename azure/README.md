# WealthWise Azure Deployment

## Architecture

```
Azure Front Door (CDN + WAF)
    |
    +-- /api/*  --> Container App: API (Express)
    +-- /*      --> Container App: Web (Next.js)
                        |
                   Cosmos DB (MongoDB API)
                        |
                   Azure Key Vault (secrets)
```

- **Azure Front Door** - Global CDN, SSL termination, routing
- **Azure Container Apps** - Serverless containers for API and Web
- **Azure Cosmos DB (MongoDB API)** - Managed MongoDB-compatible database
- **Azure Key Vault** - Secrets management (JWT keys, connection strings)
- **Azure Container Registry** - Private Docker image storage
- **Azure Log Analytics** - Centralized logging and monitoring
- **Virtual Network** - Network isolation for database and container apps

## Prerequisites

1. **Azure CLI** (v2.50+): [Install guide](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Bicep CLI** (bundled with Azure CLI v2.20+)
3. **Docker** (for building container images)
4. **An Azure subscription** with permissions to create resources

Verify your setup:

```bash
az version          # Azure CLI version
az bicep version    # Bicep version
docker --version    # Docker version
```

## Deployment Guide

### 1. Login to Azure

```bash
az login
az account set --subscription "<YOUR_SUBSCRIPTION_ID>"
```

### 2. Create a Resource Group

```bash
az group create \
    --name wealthwise-production \
    --location eastus2
```

### 3. Configure Secrets

Generate secrets and populate Key Vault:

```bash
export KEY_VAULT_NAME="ww-production-kv"
export JWT_SECRET="$(openssl rand -base64 48)"
export JWT_REFRESH_SECRET="$(openssl rand -base64 48)"
export NEXTAUTH_SECRET="$(openssl rand -base64 48)"
export MONGODB_URI="<your-cosmos-db-connection-string>"

./azure/scripts/setup-keyvault.sh
```

### 4. Deploy Infrastructure and Application

```bash
export AZURE_SUBSCRIPTION_ID="<your-subscription-id>"
export RESOURCE_GROUP="wealthwise-production"
export ACR_NAME="wwproductionacr"
export ENVIRONMENT="production"

./azure/scripts/deploy.sh
```

### 5. Verify Deployment

```bash
# Check container app status
az containerapp show \
    --name ww-production-api \
    --resource-group wealthwise-production \
    --query "properties.runningStatus"

# Check API health
curl https://<api-fqdn>/api/health
```

## Environments

| Environment | Resource Group | Key Vault | Replicas (API) | Replicas (Web) |
|-------------|---------------|-----------|----------------|----------------|
| dev | wealthwise-dev | ww-dev-kv | 1 | 1 |
| staging | wealthwise-staging | ww-staging-kv | 2 | 2 |
| production | wealthwise-production | ww-production-kv | 3-10 | 3-8 |

## Bicep Modules

| Module | Description |
|--------|-------------|
| `vnet.bicep` | Virtual network with subnets and NSGs |
| `log-analytics.bicep` | Log Analytics workspace |
| `acr.bicep` | Azure Container Registry |
| `key-vault.bicep` | Key Vault with application secrets |
| `cosmos-db.bicep` | Cosmos DB account (MongoDB API) with private endpoint |
| `container-apps-env.bicep` | Container Apps managed environment |
| `container-app-api.bicep` | API container app |
| `container-app-web.bicep` | Web container app |
| `front-door.bicep` | Azure Front Door CDN and routing |
