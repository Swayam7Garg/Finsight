terraform {
  backend "s3" {
    bucket         = "wealthwise-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "wealthwise-terraform-locks"
    encrypt        = true
  }
}
