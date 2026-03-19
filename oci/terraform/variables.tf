variable "tenancy_ocid" {
  description = "OCI tenancy OCID"
  type        = string
}

variable "compartment_ocid" {
  description = "OCI compartment OCID"
  type        = string
}

variable "region" {
  description = "OCI region"
  type        = string
  default     = "us-ashburn-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "kubernetes_version" {
  description = "Kubernetes version for OKE"
  type        = string
  default     = "v1.28.2"
}

variable "node_shape" {
  description = "OKE node shape"
  type        = string
  default     = "VM.Standard.E4.Flex"
}

variable "node_count" {
  description = "Number of nodes in the pool"
  type        = number
  default     = 2
}

variable "node_ocpus" {
  description = "OCPUs per node"
  type        = number
  default     = 2
}

variable "node_memory_gb" {
  description = "Memory in GB per node"
  type        = number
  default     = 16
}

variable "node_image_id" {
  description = "Node image OCID (Oracle Linux)"
  type        = string
}
