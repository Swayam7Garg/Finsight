terraform {
  backend "s3" {
    bucket         = "wealthwise-terraform-state"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "wealthwise-terraform-locks"
    encrypt        = true
  }
}
