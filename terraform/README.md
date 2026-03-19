# WealthWise Terraform Infrastructure

AWS infrastructure as code for the WealthWise personal finance application.

## Module Structure

```
terraform/
├── versions.tf                    # Provider version constraints
├── modules/
│   ├── networking/                # VPC, subnets, IGW, NAT
│   ├── compute/                   # ECS Fargate cluster, services, auto scaling
│   ├── database/                  # DocumentDB cluster
│   ├── monitoring/                # CloudWatch dashboards, alarms, SNS
│   ├── dns/                       # Route53 hosted zone, ACM certificates
│   └── container-registry/        # ECR repositories
└── environments/
    ├── dev/                       # Development environment
    ├── staging/                   # Staging environment
    └── production/                # Production environment
```

## Prerequisites

- [Terraform](https://www.terraform.io/downloads) >= 1.5
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- An S3 bucket for Terraform state (default: `wealthwise-terraform-state`)
- A DynamoDB table for state locking (default: `wealthwise-terraform-locks`)

### Creating the State Backend

```bash
aws s3api create-bucket \
  --bucket wealthwise-terraform-state \
  --region us-east-1

aws s3api put-bucket-versioning \
  --bucket wealthwise-terraform-state \
  --versioning-configuration Status=Enabled

aws dynamodb create-table \
  --table-name wealthwise-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Usage

### Development

```bash
cd terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

terraform init
terraform plan
terraform apply
```

### Staging

```bash
cd terraform/environments/staging
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

### Production

```bash
cd terraform/environments/production
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

## Variable Customization

Each environment has a `terraform.tfvars.example` file showing all configurable variables. At minimum, you must set:

| Variable | Description |
|----------|-------------|
| `region` | AWS region for deployment |
| `alarm_email` | Email address for CloudWatch alarm notifications |
| `db_password` | DocumentDB master password |

### Environment Sizing Defaults

| Resource | Dev | Staging | Production |
|----------|-----|---------|------------|
| ECS CPU | 256 | 512 | 512 |
| ECS Memory | 512 | 1024 | 1024 |
| Min Capacity | 1 | 2 | 3 |
| Max Capacity | 3 | 6 | 10 |
| DB Instance Class | db.t3.medium | db.r6g.medium | db.r6g.large |
| DB Instance Count | 1 | 2 | 2 |

## Destroying Infrastructure

```bash
cd terraform/environments/<env>
terraform destroy
```

**Warning**: This will destroy all resources in the environment including the database. Ensure backups exist before destroying production.
