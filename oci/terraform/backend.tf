terraform {
  backend "s3" {
    bucket                      = "wealthwise-terraform-state"
    key                         = "oci/terraform.tfstate"
    region                      = "us-ashburn-1"
    # Replace TENANCY_NAMESPACE with your OCI Object Storage namespace
    # Find it via: oci os ns get
    endpoint                    = "https://TENANCY_NAMESPACE.compat.objectstorage.us-ashburn-1.oraclecloud.com"
    skip_region_validation      = true
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    force_path_style            = true
  }
}
