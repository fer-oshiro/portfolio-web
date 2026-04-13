output "websocket_url" {
  value = aws_apigatewayv2_stage.prod.invoke_url
}
