output "cluster_endpoint" {
  description = "Endpoint of the DocumentDB cluster"
  value       = aws_docdb_cluster.main.endpoint
}

output "reader_endpoint" {
  description = "Reader endpoint of the DocumentDB cluster"
  value       = aws_docdb_cluster.main.reader_endpoint
}

output "port" {
  description = "Port of the DocumentDB cluster"
  value       = aws_docdb_cluster.main.port
}

output "connection_string" {
  description = "MongoDB connection string for the DocumentDB cluster"
  value       = "mongodb://${var.master_username}:${var.master_password}@${aws_docdb_cluster.main.endpoint}:${aws_docdb_cluster.main.port}/?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
  sensitive   = true
}
