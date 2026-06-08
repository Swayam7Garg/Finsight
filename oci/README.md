# FinSight OCI Deployment

## Architecture

```
OCI Load Balancer (HTTPS)
└── OKE Cluster (Kubernetes)
    ├── finsight-api (Deployment)
    └── finsight-web (Deployment)

MongoDB Atlas (external, VCN peered)
```

## Prerequisites

- OCI CLI installed and configured
- kubectl installed
- Compartment created for FinSight resources
- MongoDB Atlas cluster with VCN peering configured

## Quick Start

1. **Deploy infrastructure with Terraform:**
   ```bash
   cd oci/terraform
   terraform init
   terraform plan
   terraform apply
   ```

2. **Configure kubectl:**
   ```bash
   oci ce cluster create-kubeconfig \
     --cluster-id <cluster_ocid> \
     --file $HOME/.kube/config \
     --region <region> \
     --token-version 2.0.0
   ```

3. **Set up secrets in OCI Vault:**
   ```bash
   ./oci/scripts/setup-vault.sh
   ```

4. **Deploy application:**
   ```bash
   ./oci/scripts/deploy.sh
   ```

## Image Registry

Images are stored in OCI Container Registry (OCIR):
```
<region>.ocir.io/<namespace>/finsight-api
<region>.ocir.io/<namespace>/finsight-web
```
