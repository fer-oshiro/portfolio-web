output "websocket_url" {
  value = "${aws_apigatewayv2_stage.prod.invoke_url}"
}

output "identity_pool_id" {
  value = aws_cognito_identity_pool.id_pool.id
}

output "user_pool_id" {
  value = aws_cognito_user_pool.pool.id
}

output "client_id" {
  value = aws_cognito_user_pool_client.client.id
}
