resource "aws_docdb_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "${var.project_name}-${var.environment}-docdb-subnet-group"
    Project     = "wealthwise"
    Environment = var.environment
  }
}

resource "aws_docdb_cluster_parameter_group" "main" {
  family      = "docdb${var.engine_version}"
  name        = "${var.project_name}-${var.environment}"
  description = "DocumentDB parameter group for ${var.project_name} ${var.environment}"

  parameter {
    name  = "tls"
    value = "enabled"
  }

  tags = {
    Project     = "wealthwise"
    Environment = var.environment
  }
}

resource "aws_security_group" "docdb" {
  name_prefix = "${var.project_name}-${var.environment}-docdb-"
  description = "Security group for DocumentDB"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow MongoDB traffic from ECS tasks"
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-docdb-sg"
    Project     = "wealthwise"
    Environment = var.environment
  }
}

resource "aws_docdb_cluster" "main" {
  cluster_identifier              = "${var.project_name}-${var.environment}"
  engine                          = "docdb"
  engine_version                  = var.engine_version
  master_username                 = var.master_username
  master_password                 = var.master_password
  db_subnet_group_name            = aws_docdb_subnet_group.main.name
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.main.name
  vpc_security_group_ids          = [aws_security_group.docdb.id]
  backup_retention_period         = var.backup_retention_period
  preferred_backup_window         = "03:00-05:00"
  skip_final_snapshot             = var.environment != "production"
  final_snapshot_identifier       = var.environment == "production" ? "${var.project_name}-${var.environment}-final" : null
  storage_encrypted               = true

  tags = {
    Project     = "wealthwise"
    Environment = var.environment
  }
}

resource "aws_docdb_cluster_instance" "main" {
  count = var.instance_count

  identifier         = "${var.project_name}-${var.environment}-${count.index + 1}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = var.instance_class

  tags = {
    Project     = "wealthwise"
    Environment = var.environment
  }
}
