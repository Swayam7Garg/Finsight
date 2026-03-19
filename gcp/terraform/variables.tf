variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "domain" {
  description = "Domain name for the application"
  type        = string
}

variable "api_image" {
  description = "Container image for the API (e.g. REGION-docker.pkg.dev/PROJECT/wealthwise-api/api:TAG)"
  type        = string
}

variable "web_image" {
  description = "Container image for the web frontend (e.g. REGION-docker.pkg.dev/PROJECT/wealthwise-web/web:TAG)"
  type        = string
}

variable "api_min_instances" {
  description = "Minimum API instances"
  type        = number
  default     = 1
}

variable "api_max_instances" {
  description = "Maximum API instances"
  type        = number
  default     = 10
}

variable "web_min_instances" {
  description = "Minimum web instances"
  type        = number
  default     = 1
}

variable "web_max_instances" {
  description = "Maximum web instances"
  type        = number
  default     = 8
}
