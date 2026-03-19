output "cluster_id" {
  description = "OKE cluster OCID"
  value       = oci_containerengine_cluster.main.id
}

output "kubeconfig_command" {
  description = "Command to configure kubectl"
  value       = "oci ce cluster create-kubeconfig --cluster-id ${oci_containerengine_cluster.main.id} --file $HOME/.kube/config --region ${var.region} --token-version 2.0.0"
}

output "api_ocir_url" {
  description = "OCIR URL for API images"
  value       = "${var.region}.ocir.io/${oci_artifacts_container_repository.api.display_name}"
}

output "web_ocir_url" {
  description = "OCIR URL for web images"
  value       = "${var.region}.ocir.io/${oci_artifacts_container_repository.web.display_name}"
}

output "vault_id" {
  description = "OCI Vault OCID"
  value       = oci_kms_vault.main.id
}

output "load_balancer_subnet_id" {
  description = "Public subnet for load balancer"
  value       = oci_core_subnet.public.id
}
