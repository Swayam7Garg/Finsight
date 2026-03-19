variable "domain_name" {
  description = "Root domain name"
  type        = string
}

variable "subdomain" {
  description = "Subdomain prefix (leave empty for apex domain)"
  type        = string
  default     = ""
}

variable "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  type        = string
}

variable "alb_zone_id" {
  description = "Route53 zone ID of the Application Load Balancer"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}
