locals {
  signaling_zip_path = "${path.module}/../../apps/backend/realtime/dist/aws/signaling.zip"
  chat_zip_path      = "${path.module}/../../apps/backend/realtime/dist/aws/chat.zip"
  drawing_zip_path   = "${path.module}/../../apps/backend/realtime/dist/aws/drawing.zip"
}

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
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = "arn:aws:s3:::${var.s3_bucket_name}"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "arn:aws:s3:::${var.s3_bucket_name}/submissions/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "arn:aws:s3:::${var.s3_bucket_name}/gallery/*"
      }
    ]
  })
}

resource "aws_lambda_function" "ws_handler" {
  function_name    = "${var.project_name}-ws-handler"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = local.signaling_zip_path
  source_code_hash = fileexists(local.signaling_zip_path) ? filebase64sha256(local.signaling_zip_path) : null

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
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = local.chat_zip_path
  source_code_hash = fileexists(local.chat_zip_path) ? filebase64sha256(local.chat_zip_path) : null
  timeout          = 30

  environment {
    variables = {
      GROQ_API_KEY = var.groq_api_key
    }
  }
}

resource "aws_cloudwatch_log_group" "chat_lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.chat_handler.function_name}"
  retention_in_days = 90
}

resource "aws_lambda_function" "draw_handler" {
  function_name    = "${var.project_name}-draw-handler"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = local.drawing_zip_path
  source_code_hash = fileexists(local.drawing_zip_path) ? filebase64sha256(local.drawing_zip_path) : null

  environment {
    variables = {
      DRAWINGS_BUCKET          = var.s3_bucket_name
      DRAWINGS_PUBLIC_BASE_URL = var.drawings_public_base_url
    }
  }
}

resource "aws_cloudwatch_log_group" "draw_lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.draw_handler.function_name}"
  retention_in_days = 90
}
