terraform {
  backend "s3" {
    bucket         = "finsight-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "finsight-terraform-locks"
    encrypt        = true
  }
}
