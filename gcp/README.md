# WealthWise GCP Deployment

## Architecture

```
Cloud Load Balancer (HTTPS)
├── /api/* → Cloud Run (wealthwise-api)
└── /*     → Cloud Run (wealthwise-web)

MongoDB Atlas (external, VPC peered)
```

## Prerequisites

- Google Cloud SDK (`gcloud`) installed and configured
- Project created with billing enabled
- APIs enabled: Cloud Run, Compute Engine, Secret Manager, Artifact Registry, VPC Access
- MongoDB Atlas cluster configured with VPC peering

## Quick Start

1. **Set up secrets:**
   ```bash
   gcloud secrets create jwt-secret --data-file=- <<< "your-jwt-secret"
   gcloud secrets create jwt-refresh-secret --data-file=- <<< "your-jwt-refresh-secret"
   gcloud secrets create nextauth-secret --data-file=- <<< "your-nextauth-secret"
   gcloud secrets create mongodb-uri --data-file=- <<< "mongodb+srv://..."
   ```

2. **Deploy with Terraform:**
   ```bash
   cd gcp/terraform
   terraform init
   terraform plan -var="project_id=my-project" -var="domain=wealthwise.example.com"
   terraform apply
   ```

3. **Or deploy with Cloud Build:**
   ```bash
   gcloud builds submit --config=gcp/cloudbuild.yaml
   ```

## Manual Cloud Run Deploy

```bash
./gcp/scripts/deploy.sh
```
