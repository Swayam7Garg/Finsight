variable "instance_class" {
  description = "DocumentDB instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "instance_count" {
  description = "Number of DocumentDB instances"
  type        = number
  default     = 2
}

variable "engine_version" {
  description = "DocumentDB engine version"
  type        = string
  default     = "7.0"
}

variable "backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "master_username" {
  description = "Master username for DocumentDB"
  type        = string
  default     = "wealthwise"
}

variable "master_password" {
  description = "Master password for DocumentDB"
  type        = string
  sensitive   = true
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs of private subnets for DocumentDB"
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "Security group IDs allowed to connect to DocumentDB"
  type        = list(string)
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "wealthwise"
}
