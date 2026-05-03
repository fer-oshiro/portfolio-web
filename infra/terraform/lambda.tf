resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["dynamodb:PutItem", "dynamodb:DeleteItem", "dynamodb:GetItem", "dynamodb:Scan", "dynamodb:Query", "dynamodb:UpdateItem"]
        Effect   = "Allow"
        Resource = [aws_dynamodb_table.connections.arn]
      },
      {
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action   = ["execute-api:ManageConnections"]
        Effect   = "Allow"
        Resource = "arn:aws:execute-api:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${aws_apigatewayv2_api.ws.id}/*"
      }
    ]
  })
}

resource "aws_lambda_function" "ws_handler" {
  function_name    = "${var.project_name}-ws-handler"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = "../../apps/ws-api/dist/index.zip"
  source_code_hash = fileexists("../../apps/ws-api/dist/index.zip") ? filebase64sha256("../../apps/ws-api/dist/index.zip") : null

  timeout = 30

  environment {
    variables = {
      TABLE_NAME         = aws_dynamodb_table.connections.name
      TWILIO_ACCOUNT_SID = var.twilio_account_sid
      TWILIO_AUTH_TOKEN  = var.twilio_auth_token
    }
  }
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.ws_handler.function_name}"
  retention_in_days = 90
}


resource "aws_lambda_function" "chat_handler" {
  function_name    = "${var.project_name}-chat-handler"
  role             = aws_iam_role.lambda_role.arn # reaproveitado
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = "../../apps/chat-api/dist/index.zip"
  source_code_hash = fileexists("../../apps/chat-api/dist/index.zip") ? filebase64sha256("../../apps/chat-api/dist/index.zip") : null

  environment {
    variables = {
      TABLE_NAME   = aws_dynamodb_table.connections.name
      GROQ_API_KEY = var.groq_api_key
    }
  }
}

resource "aws_cloudwatch_log_group" "chat_lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.chat_handler.function_name}"
  retention_in_days = 90
}
