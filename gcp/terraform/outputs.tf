output "load_balancer_ip" {
  description = "Global load balancer IP address"
  value       = google_compute_global_address.default.address
}

output "api_service_url" {
  description = "Cloud Run API service URL"
  value       = google_cloud_run_v2_service.api.uri
}

output "web_service_url" {
  description = "Cloud Run web service URL"
  value       = google_cloud_run_v2_service.web.uri
}

output "api_artifact_registry_url" {
  description = "Artifact Registry URL for API images"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}"
}

output "web_artifact_registry_url" {
  description = "Artifact Registry URL for web images"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.web.repository_id}"
}
