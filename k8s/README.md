# WealthWise Kubernetes Deployment

## Prerequisites

- Kubernetes cluster 1.27+
- kubectl configured
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) or [External Secrets Operator](https://external-secrets.io/) for secret management
- Container images pushed to your registry

## Usage

### Apply base manifests (development)
```bash
kubectl kustomize k8s/overlays/dev | kubectl apply -f -
```

### Apply staging
```bash
kubectl kustomize k8s/overlays/staging | kubectl apply -f -
```

### Apply production
```bash
kubectl kustomize k8s/overlays/production | kubectl apply -f -
```

## Secret Management

**Do not apply `secrets.template.yaml` directly.** It is a reference for the secret shape.

Use Sealed Secrets:
```bash
kubeseal --format=yaml < my-secret.yaml > sealed-secret.yaml
kubectl apply -f sealed-secret.yaml
```

Or External Secrets Operator with your cloud provider's secret manager.

## Image Updates

Update image tags in the kustomization overlay:
```yaml
images:
  - name: wealthwise-api
    newName: your-registry/wealthwise-api
    newTag: "v1.0.0"
```
