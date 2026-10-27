resource "aws_apigatewayv2_api" "ws" {
  name                       = "${var.project_name}-ws-api"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.ws.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.ws_handler.invoke_arn
}

resource "aws_apigatewayv2_integration" "lambda-chat" {
  api_id           = aws_apigatewayv2_api.ws.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.chat_handler.invoke_arn
}

resource "aws_apigatewayv2_integration" "lambda-draw" {
  api_id           = aws_apigatewayv2_api.ws.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.draw_handler.invoke_arn
}

resource "aws_apigatewayv2_authorizer" "websocket" {
  api_id           = aws_apigatewayv2_api.ws.id
  authorizer_type  = "REQUEST"
  authorizer_uri   = aws_lambda_function.ws_authorizer.invoke_arn
  identity_sources = ["route.request.querystring.challenge"]
  name             = "${var.project_name}-turnstile-authorizer"
}

resource "aws_apigatewayv2_route" "connect" {
  api_id             = aws_apigatewayv2_api.ws.id
  route_key          = "$connect"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.websocket.id
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "disconnect" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "join" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "join"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "signal" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "signal"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "ping" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "ping"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "chat" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "chat"
  target    = "integrations/${aws_apigatewayv2_integration.lambda-chat.id}"
}

resource "aws_apigatewayv2_route" "get_drawings" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "get_drawings"
  target    = "integrations/${aws_apigatewayv2_integration.lambda-draw.id}"
}

resource "aws_apigatewayv2_route" "save_drawing" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "save_drawing"
  target    = "integrations/${aws_apigatewayv2_integration.lambda-draw.id}"
}

resource "aws_lambda_permission" "apigw" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ws_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ws.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_chat" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chat_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ws.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_draw" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.draw_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ws.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_authorizer" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ws_authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ws.execution_arn}/authorizers/${aws_apigatewayv2_authorizer.websocket.id}"
}

resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${var.project_name}-api-gateway-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "apigateway.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "api_gateway_cloudwatch" {
  name = "${var.project_name}-api-gateway-cloudwatch-policy"
  role = aws_iam_role.api_gateway_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:PutLogEvents",
        "logs:GetLogEvents",
        "logs:FilterLogEvents",
      ]
      Resource = "*"
    }]
  })
}

resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn

  depends_on = [aws_iam_role_policy.api_gateway_cloudwatch]
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.ws.id
  name        = local.websocket_stage_name
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 10
    throttling_rate_limit  = 5
  }

  route_settings {
    route_key              = "$connect"
    throttling_burst_limit = 4
    throttling_rate_limit  = 2
  }

  route_settings {
    route_key              = "chat"
    throttling_burst_limit = 2
    throttling_rate_limit  = 1
  }

  route_settings {
    route_key              = "get_drawings"
    throttling_burst_limit = 2
    throttling_rate_limit  = 1
  }

  route_settings {
    route_key              = "join"
    throttling_burst_limit = 2
    throttling_rate_limit  = 1
  }

  # Heartbeat: one ping every ~4 minutes per open tab
  route_settings {
    route_key              = "ping"
    throttling_burst_limit = 10
    throttling_rate_limit  = 5
  }

  route_settings {
    route_key              = "save_drawing"
    throttling_burst_limit = 2
    throttling_rate_limit  = 1
  }

  route_settings {
    route_key              = "signal"
    throttling_burst_limit = 10
    throttling_rate_limit  = 5
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.websocket_access_logs.arn
    format = jsonencode({
      requestId        = "$context.requestId"
      routeKey         = "$context.routeKey"
      status           = "$context.status"
      integrationError = "$context.integrationErrorMessage"
    })
  }

  # route_settings needs the route to exist first
  depends_on = [aws_api_gateway_account.main, aws_apigatewayv2_route.ping]
}

resource "aws_cloudwatch_log_group" "websocket_access_logs" {
  name              = "/aws/apigateway/${var.project_name}-websocket"
  retention_in_days = 30
}

resource "aws_apigatewayv2_api" "cost_guard" {
  name          = "${var.project_name}-cost-guard-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "cost_guard" {
  api_id                 = aws_apigatewayv2_api.cost_guard.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.cost_guard.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 10000
}

resource "aws_apigatewayv2_route" "cost_guard" {
  api_id    = aws_apigatewayv2_api.cost_guard.id
  route_key = "POST /twilio/usage"
  target    = "integrations/${aws_apigatewayv2_integration.cost_guard.id}"
}

resource "aws_apigatewayv2_stage" "cost_guard" {
  api_id      = aws_apigatewayv2_api.cost_guard.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 2
    throttling_rate_limit  = 1
  }
}

resource "aws_lambda_permission" "cost_guard_api" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cost_guard.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.cost_guard.execution_arn}/*/*"
}
