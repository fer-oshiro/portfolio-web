locals {
  websocket_stage_name    = "prod"
  signaling_function_name = "${var.project_name}-ws-handler"
  chat_function_name      = "${var.project_name}-chat-handler"
  drawing_function_name   = "${var.project_name}-draw-handler"
  signaling_zip_path      = "${path.module}/../../apps/backend/realtime/dist/aws/signaling.zip"
  chat_zip_path           = "${path.module}/../../apps/backend/realtime/dist/aws/chat.zip"
  drawing_zip_path        = "${path.module}/../../apps/backend/realtime/dist/aws/drawing.zip"
}

resource "aws_iam_role" "signaling_lambda_role" {
  name = "${var.project_name}-signaling-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "signaling_lambda_policy" {
  name = "${var.project_name}-signaling-lambda-policy"
  role = aws_iam_role.signaling_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ConnectionsTable"
        Action   = ["dynamodb:DeleteItem", "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Scan"]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.connections.arn
      },
      {
        Sid      = "WebSocketConnections"
        Action   = "execute-api:ManageConnections"
        Effect   = "Allow"
        Resource = "${aws_apigatewayv2_api.ws.execution_arn}/${local.websocket_stage_name}/POST/@connections/*"
      },
      {
        Sid      = "FunctionLogs"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Effect   = "Allow"
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.signaling_function_name}:*"
      }
    ]
  })
}

resource "aws_iam_role" "chat_lambda_role" {
  name = "${var.project_name}-chat-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "chat_lambda_policy" {
  name = "${var.project_name}-chat-lambda-policy"
  role = aws_iam_role.chat_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "WebSocketConnections"
        Action   = "execute-api:ManageConnections"
        Effect   = "Allow"
        Resource = "${aws_apigatewayv2_api.ws.execution_arn}/${local.websocket_stage_name}/POST/@connections/*"
      },
      {
        Sid      = "FunctionLogs"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Effect   = "Allow"
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.chat_function_name}:*"
      }
    ]
  })
}

resource "aws_iam_role" "drawing_lambda_role" {
  name = "${var.project_name}-drawing-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "drawing_lambda_policy" {
  name = "${var.project_name}-drawing-lambda-policy"
  role = aws_iam_role.drawing_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "DrawingGallery"
        Action   = "s3:ListBucket"
        Effect   = "Allow"
        Resource = aws_s3_bucket.portfolio_bucket.arn
        Condition = {
          StringLike = {
            "s3:prefix" = "gallery/*"
          }
        }
      },
      {
        Sid      = "DrawingUploads"
        Action   = "s3:PutObject"
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.portfolio_bucket.arn}/submissions/*"
      },
      {
        Sid      = "WebSocketConnections"
        Action   = "execute-api:ManageConnections"
        Effect   = "Allow"
        Resource = "${aws_apigatewayv2_api.ws.execution_arn}/${local.websocket_stage_name}/POST/@connections/*"
      },
      {
        Sid      = "FunctionLogs"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Effect   = "Allow"
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.drawing_function_name}:*"
      }
    ]
  })
}

resource "aws_lambda_function" "ws_handler" {
  function_name    = local.signaling_function_name
  role             = aws_iam_role.signaling_lambda_role.arn
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

  depends_on = [
    aws_cloudwatch_log_group.lambda_logs,
    aws_iam_role_policy.signaling_lambda_policy,
  ]
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${local.signaling_function_name}"
  retention_in_days = 90
}

resource "aws_lambda_function" "chat_handler" {
  function_name    = local.chat_function_name
  role             = aws_iam_role.chat_lambda_role.arn
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

  depends_on = [
    aws_cloudwatch_log_group.chat_lambda_logs,
    aws_iam_role_policy.chat_lambda_policy,
  ]
}

resource "aws_cloudwatch_log_group" "chat_lambda_logs" {
  name              = "/aws/lambda/${local.chat_function_name}"
  retention_in_days = 90
}

resource "aws_lambda_function" "draw_handler" {
  function_name    = local.drawing_function_name
  role             = aws_iam_role.drawing_lambda_role.arn
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

  depends_on = [
    aws_cloudwatch_log_group.draw_lambda_logs,
    aws_iam_role_policy.drawing_lambda_policy,
  ]
}

resource "aws_cloudwatch_log_group" "draw_lambda_logs" {
  name              = "/aws/lambda/${local.drawing_function_name}"
  retention_in_days = 90
}
