terraform {
  backend "gcs" {
    bucket = "wealthwise-terraform-state"
    prefix = "gcp"
  }
}
