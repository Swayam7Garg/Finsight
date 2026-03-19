# WealthWise AWS Deployment

## Architecture

```
Internet
   |
   v
  ALB (Application Load Balancer)
   |--- /api/*  --> ECS Fargate (wealthwise-api, port 4000)
   |--- /*      --> ECS Fargate (wealthwise-web, port 3000)
   |
   v
  DocumentDB (MongoDB-compatible)
```

- **Compute**: ECS Fargate (serverless containers, no EC2 management)
- **Database**: Amazon DocumentDB (MongoDB 7.0 compatible)
- **Networking**: VPC with public/private subnets across 3 AZs
- **Load Balancing**: ALB with HTTPS termination, path-based routing
- **Secrets**: AWS Secrets Manager for JWT keys, DB connection string
- **Monitoring**: CloudWatch dashboards, alarms, SNS notifications
- **Container Registry**: ECR with lifecycle policies

## Prerequisites

- AWS CLI v2 configured with appropriate IAM permissions
- Docker installed locally
- An ACM certificate for your domain (for HTTPS)
- A registered domain with Route 53 (optional, can use ALB DNS)

## Deployment Order

Deploy CloudFormation stacks in this order (each depends on the previous):

1. **VPC** - Networking foundation
   ```bash
   aws cloudformation deploy \
     --template-file aws/cloudformation/vpc.yaml \
     --stack-name wealthwise-vpc \
     --parameter-overrides EnvironmentName=production
   ```

2. **ECR** - Container repositories
   ```bash
   aws cloudformation deploy \
     --template-file aws/cloudformation/ecr.yaml \
     --stack-name wealthwise-ecr
   ```

3. **Secrets** - Application secrets
   ```bash
   # Set environment variables first, then:
   bash aws/scripts/setup-secrets.sh

   aws cloudformation deploy \
     --template-file aws/cloudformation/secrets.yaml \
     --stack-name wealthwise-secrets \
     --capabilities CAPABILITY_IAM
   ```

4. **DocumentDB** - Database cluster
   ```bash
   aws cloudformation deploy \
     --template-file aws/cloudformation/documentdb.yaml \
     --stack-name wealthwise-documentdb \
     --parameter-overrides \
       VPCId=<vpc-id> \
       PrivateSubnetIds=<subnet-1>,<subnet-2>,<subnet-3> \
       ECSSecurityGroupId=<ecs-sg-id> \
       MasterUsername=wealthwise \
       MasterUserPassword=<password>
   ```

5. **ALB** - Load balancer
   ```bash
   aws cloudformation deploy \
     --template-file aws/cloudformation/alb.yaml \
     --stack-name wealthwise-alb \
     --parameter-overrides \
       VPCId=<vpc-id> \
       PublicSubnetIds=<subnet-1>,<subnet-2>,<subnet-3> \
       CertificateArn=<acm-cert-arn>
   ```

6. **ECS Services** - Create the cluster and services
   ```bash
   aws ecs create-cluster --cluster-name wealthwise

   # Register task definitions
   aws ecs register-task-definition --cli-input-json file://aws/ecs/task-definition-api.json
   aws ecs register-task-definition --cli-input-json file://aws/ecs/task-definition-web.json

   # Create services
   aws ecs create-service --cli-input-json file://aws/ecs/service-api.json
   aws ecs create-service --cli-input-json file://aws/ecs/service-web.json
   ```

7. **Monitoring** - Dashboards and alarms
   ```bash
   aws cloudformation deploy \
     --template-file aws/cloudformation/monitoring.yaml \
     --stack-name wealthwise-monitoring \
     --parameter-overrides \
       ClusterName=wealthwise \
       ALBFullName=<alb-full-name> \
       AlertEmail=ops@example.com
   ```

## Subsequent Deployments

After initial setup, use the deploy script for code changes:

```bash
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=us-east-1

bash aws/scripts/deploy.sh
```

## Cost Estimates (us-east-1)

| Resource | Estimated Monthly Cost |
|----------|----------------------|
| ECS Fargate (2 API + 2 Web tasks) | ~$60 |
| DocumentDB (2x db.r6g.large) | ~$380 |
| ALB | ~$20 |
| NAT Gateway | ~$35 |
| ECR storage | ~$1 |
| CloudWatch | ~$5 |
| Secrets Manager | ~$2 |
| **Total** | **~$503/month** |

To reduce costs for non-production environments:
- Use 1 DocumentDB instance instead of 2
- Use smaller DocumentDB instance class (db.t4g.medium ~$55/mo)
- Reduce ECS task count to 1 per service
