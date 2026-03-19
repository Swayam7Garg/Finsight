output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home#dashboards:name=${var.project_name}-${var.environment}"
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "alarm_arns" {
  description = "ARNs of all CloudWatch alarms"
  value = [
    aws_cloudwatch_metric_alarm.api_high_cpu.arn,
    aws_cloudwatch_metric_alarm.web_high_cpu.arn,
    aws_cloudwatch_metric_alarm.high_5xx.arn,
    aws_cloudwatch_metric_alarm.api_unhealthy_hosts.arn,
    aws_cloudwatch_metric_alarm.web_unhealthy_hosts.arn,
  ]
}
