terraform {
  backend "gcs" {
    bucket = "finsight-terraform-state"
    prefix = "gcp"
  }
}
