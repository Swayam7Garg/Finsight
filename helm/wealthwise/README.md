# WealthWise Helm Chart

Helm chart for deploying the WealthWise personal finance application to Kubernetes.

## Prerequisites

- Kubernetes 1.26+
- Helm 3.x
- A MongoDB instance (connection string provided via secrets)
- An ingress controller (nginx recommended) if using Ingress

## Quick Start

```bash
# Dev (no TLS, single replica, relaxed policies)
helm install wealthwise ./helm/wealthwise \
  -f ./helm/wealthwise/values-dev.yaml \
  --set secrets.jwtSecret=changeme \
  --set secrets.jwtRefreshSecret=changeme \
  --set secrets.nextauthSecret=changeme \
  --set secrets.mongodbUri=mongodb://localhost:27017/wealthwise

# Staging
helm install wealthwise ./helm/wealthwise \
  -f ./helm/wealthwise/values-staging.yaml \
  --set existingSecret=my-sealed-secret

# Production
helm install wealthwise ./helm/wealthwise \
  -f ./helm/wealthwise/values-production.yaml \
  --set existingSecret=my-sealed-secret
```

## Architecture

Single umbrella chart with two workloads:

| Component | Description | Default Port |
|-----------|-------------|-------------|
| **api** | Express REST API (Node.js) | 4000 |
| **web** | Next.js frontend | 3000 |

Both are deployed as separate Deployments with their own Services, HPAs, and PDBs.

## Values

### Global

| Key | Description | Default |
|-----|-------------|---------|
| `nameOverride` | Override chart name | `""` |
| `fullnameOverride` | Override fully qualified name | `""` |
| `namespace.create` | Create the namespace resource | `false` |
| `namespace.name` | Target namespace (defaults to release namespace) | `""` |
| `imagePullSecrets` | Registry pull secrets | `[]` |
| `existingSecret` | Use a pre-existing Secret instead of chart-managed | `""` |
| `existingConfigMap` | Use a pre-existing ConfigMap instead of chart-managed | `""` |

### Secrets

Only used when `existingSecret` is empty. **For production, use `existingSecret` with Sealed Secrets or External Secrets Operator.**

| Key | Description |
|-----|-------------|
| `secrets.jwtSecret` | JWT signing key (min 32 chars) |
| `secrets.jwtRefreshSecret` | Refresh token signing key (min 32 chars) |
| `secrets.nextauthSecret` | NextAuth session secret (min 32 chars) |
| `secrets.mongodbUri` | MongoDB connection string |

### API

| Key | Description | Default |
|-----|-------------|---------|
| `api.replicaCount` | Number of replicas | `2` |
| `api.port` | Container port | `4000` |
| `api.image.repository` | Image name | `wealthwise-api` |
| `api.image.tag` | Image tag (defaults to `appVersion`) | `""` |
| `api.image.pullPolicy` | Pull policy | `IfNotPresent` |
| `api.service.type` | Service type | `ClusterIP` |
| `api.resources` | CPU/memory requests and limits | 128Mi/100m req, 512Mi/500m limit |
| `api.autoscaling.enabled` | Enable HPA | `true` |
| `api.autoscaling.minReplicas` | HPA min | `2` |
| `api.autoscaling.maxReplicas` | HPA max | `10` |
| `api.autoscaling.targetCPUUtilization` | HPA CPU target | `70` |
| `api.pdb.enabled` | Enable PodDisruptionBudget | `true` |
| `api.pdb.minAvailable` | PDB minAvailable | `1` |
| `api.topologySpreadConstraints.enabled` | Enable topology spread | `true` |
| `api.extraEnv` | Additional env vars | `[]` |

### Web

| Key | Description | Default |
|-----|-------------|---------|
| `web.replicaCount` | Number of replicas | `2` |
| `web.port` | Container port | `3000` |
| `web.image.repository` | Image name | `wealthwise-web` |
| `web.image.tag` | Image tag (defaults to `appVersion`) | `""` |
| `web.image.pullPolicy` | Pull policy | `IfNotPresent` |
| `web.service.type` | Service type | `ClusterIP` |
| `web.nextauthUrl` | NextAuth base URL | `https://wealthwise.example.com` |
| `web.nextPublicApiUrl` | Public API URL for browser | `https://wealthwise.example.com/api/v1` |
| `web.resources` | CPU/memory requests and limits | 128Mi/100m req, 512Mi/500m limit |
| `web.autoscaling.enabled` | Enable HPA | `true` |
| `web.autoscaling.minReplicas` | HPA min | `2` |
| `web.autoscaling.maxReplicas` | HPA max | `8` |
| `web.autoscaling.targetCPUUtilization` | HPA CPU target | `70` |
| `web.pdb.enabled` | Enable PodDisruptionBudget | `true` |
| `web.pdb.minAvailable` | PDB minAvailable | `1` |
| `web.topologySpreadConstraints.enabled` | Enable topology spread | `true` |
| `web.extraEnv` | Additional env vars | `[]` |

### Ingress

| Key | Description | Default |
|-----|-------------|---------|
| `ingress.enabled` | Create Ingress resource | `true` |
| `ingress.className` | Ingress class | `nginx` |
| `ingress.host` | Hostname | `wealthwise.example.com` |
| `ingress.annotations` | Ingress annotations | rate-limit, ssl-redirect, body-size |
| `ingress.tls.enabled` | Enable TLS | `true` |
| `ingress.tls.secretName` | TLS certificate secret | `wealthwise-tls` |

### Network Policies

| Key | Description | Default |
|-----|-------------|---------|
| `networkPolicies.enabled` | Enable all network policies | `true` |
| `networkPolicies.mongodbPort` | MongoDB port for egress rules | `27017` |

When enabled, deploys 5 policies: default-deny, API ingress (from web + ingress controller), API egress (MongoDB + DNS), web ingress (from ingress controller), web egress (to API + DNS).

## Environment Overrides

| File | Use Case | Key Differences |
|------|----------|-----------------|
| `values.yaml` | Base defaults | 2 replicas, all features enabled |
| `values-dev.yaml` | Local/dev clusters | 1 replica, 256Mi limits, HPA/PDB/network policies/TLS disabled |
| `values-staging.yaml` | Staging | Staging hostname and TLS secret, inherits base defaults |
| `values-production.yaml` | Production | 3 replicas, 1Gi/1000m limits |

## Security

All pods run with a hardened security context:

- `runAsNonRoot: true`
- `readOnlyRootFilesystem: true`
- `allowPrivilegeEscalation: false`
- All capabilities dropped
- `seccompProfile: RuntimeDefault`

Deployments include `checksum/config` and `checksum/secret` pod annotations to trigger rolling restarts when ConfigMap or Secret contents change.

## Managing Secrets

**Development:** Pass secrets directly via `--set`:

```bash
helm install wealthwise ./helm/wealthwise \
  -f ./helm/wealthwise/values-dev.yaml \
  --set secrets.jwtSecret=dev-secret-min-32-characters-long \
  --set secrets.jwtRefreshSecret=dev-refresh-min-32-chars-long \
  --set secrets.nextauthSecret=dev-nextauth-min-32-chars-long \
  --set secrets.mongodbUri=mongodb://mongo:27017/wealthwise
```

**Production:** Use `existingSecret` to reference a Sealed Secret or External Secrets resource:

```bash
helm install wealthwise ./helm/wealthwise \
  -f ./helm/wealthwise/values-production.yaml \
  --set existingSecret=wealthwise-sealed-secrets
```

The referenced Secret must contain keys: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NEXTAUTH_SECRET`, `MONGODB_URI`.

## Upgrading

```bash
helm upgrade wealthwise ./helm/wealthwise -f ./helm/wealthwise/values-production.yaml
```

Rollback:

```bash
helm rollback wealthwise <revision>
```

## Validation

```bash
# Lint
helm lint ./helm/wealthwise
helm lint ./helm/wealthwise -f ./helm/wealthwise/values-dev.yaml

# Dry-run render
helm template wealthwise ./helm/wealthwise \
  --set secrets.jwtSecret=x,secrets.jwtRefreshSecret=x,secrets.nextauthSecret=x,secrets.mongodbUri=x

# Diff before upgrade (requires helm-diff plugin)
helm diff upgrade wealthwise ./helm/wealthwise -f ./helm/wealthwise/values-production.yaml
```
