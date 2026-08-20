output "websocket_url" {
  value = aws_apigatewayv2_stage.prod.invoke_url
}

output "twilio_usage_trigger_webhook_url" {
  description = "Callback assinado usado pelos Usage Triggers da subconta Twilio"
  value       = "https://${aws_apigatewayv2_api.cost_guard.id}.execute-api.${var.aws_region}.amazonaws.com/twilio/usage"
}

output "security_alerts_topic_arn" {
  value = aws_sns_topic.security_alerts.arn
}
