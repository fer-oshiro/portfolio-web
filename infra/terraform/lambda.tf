locals {
  websocket_stage_name     = "prod"
  authorizer_function_name = "${var.project_name}-ws-authorizer"
  signaling_function_name  = "${var.project_name}-ws-handler"
  chat_function_name       = "${var.project_name}-chat-handler"
  drawing_function_name    = "${var.project_name}-draw-handler"
  cost_guard_function_name = "${var.project_name}-twilio-cost-guard"
  authorizer_zip_path      = "${path.module}/../../apps/backend/dist/aws/authorizer.zip"
  signaling_zip_path       = "${path.module}/../../apps/backend/dist/aws/signaling.zip"
  chat_zip_path            = "${path.module}/../../apps/backend/dist/aws/chat.zip"
  drawing_zip_path         = "${path.module}/../../apps/backend/dist/aws/drawing.zip"
  cost_guard_zip_path      = "${path.module}/../../apps/backend/dist/aws/cost-guard.zip"
  security_quotas_json     = jsonencode(var.security_quotas)
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
        Action   = ["dynamodb:DeleteItem", "dynamodb:GetItem", "dynamodb:PutItem"]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.connections.arn
      },
      {
        Sid      = "ConnectionsRoomIndex"
        Action   = "dynamodb:Query"
        Effect   = "Allow"
        Resource = "${aws_dynamodb_table.connections.arn}/index/roomId-index"
      },
      {
        Sid      = "SecuritySessions"
        Action   = ["dynamodb:DeleteItem", "dynamodb:GetItem", "dynamodb:PutItem"]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.security.arn
      },
      {
        Sid      = "SharedTurnCredentials"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem"]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.turn_credentials.arn
      },
      {
        Sid      = "ConsumeSecurityQuotaTransaction"
        Action   = "dynamodb:UpdateItem"
        Effect   = "Allow"
        Resource = aws_dynamodb_table.security.arn
        Condition = {
          "ForAnyValue:StringEquals" = {
            "dynamodb:EnclosingOperation" = ["TransactWriteItems"]
          }
        }
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
        Sid      = "ReadSecuritySession"
        Action   = "dynamodb:GetItem"
        Effect   = "Allow"
        Resource = aws_dynamodb_table.security.arn
      },
      {
        Sid      = "ConsumeSecurityQuotaTransaction"
        Action   = "dynamodb:UpdateItem"
        Effect   = "Allow"
        Resource = aws_dynamodb_table.security.arn
        Condition = {
          "ForAnyValue:StringEquals" = {
            "dynamodb:EnclosingOperation" = ["TransactWriteItems"]
          }
        }
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
        Sid      = "ReadSecuritySession"
        Action   = "dynamodb:GetItem"
        Effect   = "Allow"
        Resource = aws_dynamodb_table.security.arn
      },
      {
        Sid      = "ConsumeSecurityQuotaTransaction"
        Action   = "dynamodb:UpdateItem"
        Effect   = "Allow"
        Resource = aws_dynamodb_table.security.arn
        Condition = {
          "ForAnyValue:StringEquals" = {
            "dynamodb:EnclosingOperation" = ["TransactWriteItems"]
          }
        }
      },
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

  reserved_concurrent_executions = 4
  timeout                        = 10

  environment {
    variables = {
      TABLE_NAME                  = aws_dynamodb_table.connections.name
      QUOTAS_TABLE_NAME           = aws_dynamodb_table.security.name
      SECURITY_QUOTAS_JSON        = local.security_quotas_json
      TURN_CREDENTIALS_TABLE_NAME = aws_dynamodb_table.turn_credentials.name
      # Shared by every room and renewed after half of it: at most 8 per day
      TURN_CREDENTIAL_TTL_SECONDS = "21600"
      TWILIO_ACCOUNT_SID          = var.twilio_account_sid
      TWILIO_AUTH_TOKEN           = var.twilio_auth_token
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
  function_name                  = local.chat_function_name
  role                           = aws_iam_role.chat_lambda_role.arn
  handler                        = "index.handler"
  runtime                        = "nodejs20.x"
  filename                       = local.chat_zip_path
  source_code_hash               = fileexists(local.chat_zip_path) ? filebase64sha256(local.chat_zip_path) : null
  reserved_concurrent_executions = 2
  timeout                        = 25

  environment {
    variables = {
      GROQ_API_KEY               = var.groq_api_key
      GROQ_MAX_COMPLETION_TOKENS = "300"
      QUOTAS_TABLE_NAME          = aws_dynamodb_table.security.name
      SECURITY_QUOTAS_JSON       = local.security_quotas_json
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
  function_name                  = local.drawing_function_name
  role                           = aws_iam_role.drawing_lambda_role.arn
  handler                        = "index.handler"
  runtime                        = "nodejs20.x"
  filename                       = local.drawing_zip_path
  source_code_hash               = fileexists(local.drawing_zip_path) ? filebase64sha256(local.drawing_zip_path) : null
  reserved_concurrent_executions = 2
  timeout                        = 10

  environment {
    variables = {
      DRAWINGS_BUCKET           = var.s3_bucket_name
      DRAWINGS_PUBLIC_BASE_URL  = var.drawings_public_base_url
      MAX_UPLOAD_BYTES          = "1000000"
      QUOTAS_TABLE_NAME         = aws_dynamodb_table.security.name
      SECURITY_QUOTAS_JSON      = local.security_quotas_json
      UPLOAD_EXPIRES_IN_SECONDS = "300"
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

resource "aws_iam_role" "authorizer_lambda_role" {
  name = "${var.project_name}-authorizer-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "authorizer_lambda_policy" {
  name = "${var.project_name}-authorizer-lambda-policy"
  role = aws_iam_role.authorizer_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "CreateSecuritySession"
        Action   = ["dynamodb:PutItem", "dynamodb:UpdateItem"]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.security.arn
        Condition = {
          "ForAnyValue:StringEquals" = {
            "dynamodb:EnclosingOperation" = ["TransactWriteItems"]
          }
        }
      },
      {
        Sid      = "FunctionLogs"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Effect   = "Allow"
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.authorizer_function_name}:*"
      }
    ]
  })
}

resource "aws_lambda_function" "ws_authorizer" {
  function_name                  = local.authorizer_function_name
  role                           = aws_iam_role.authorizer_lambda_role.arn
  handler                        = "index.handler"
  runtime                        = "nodejs20.x"
  filename                       = local.authorizer_zip_path
  source_code_hash               = fileexists(local.authorizer_zip_path) ? filebase64sha256(local.authorizer_zip_path) : null
  reserved_concurrent_executions = 2
  timeout                        = 5

  environment {
    variables = {
      MAX_DAILY_SESSIONS   = tostring(var.security_max_daily_sessions)
      QUOTAS_TABLE_NAME    = aws_dynamodb_table.security.name
      SESSION_TTL_SECONDS  = "7200"
      TURNSTILE_ACTION     = "realtime-connect"
      TURNSTILE_HOSTNAME   = var.turnstile_hostname
      TURNSTILE_SECRET_KEY = var.turnstile_secret_key
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.authorizer_lambda_logs,
    aws_iam_role_policy.authorizer_lambda_policy,
  ]
}

resource "aws_cloudwatch_log_group" "authorizer_lambda_logs" {
  name              = "/aws/lambda/${local.authorizer_function_name}"
  retention_in_days = 90
}

resource "aws_iam_role" "cost_guard_lambda_role" {
  name = "${var.project_name}-cost-guard-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "cost_guard_lambda_policy" {
  name = "${var.project_name}-cost-guard-lambda-policy"
  role = aws_iam_role.cost_guard_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ClaimTwilioEvent"
        Action   = "dynamodb:PutItem"
        Effect   = "Allow"
        Resource = aws_dynamodb_table.security.arn
      },
      {
        Sid      = "PublishSecurityAlert"
        Action   = "sns:Publish"
        Effect   = "Allow"
        Resource = aws_sns_topic.security_alerts.arn
      },
      {
        Sid      = "FunctionLogs"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Effect   = "Allow"
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.cost_guard_function_name}:*"
      }
    ]
  })
}

resource "aws_lambda_function" "cost_guard" {
  function_name                  = local.cost_guard_function_name
  role                           = aws_iam_role.cost_guard_lambda_role.arn
  handler                        = "index.handler"
  runtime                        = "nodejs20.x"
  filename                       = local.cost_guard_zip_path
  source_code_hash               = fileexists(local.cost_guard_zip_path) ? filebase64sha256(local.cost_guard_zip_path) : null
  reserved_concurrent_executions = 1
  timeout                        = 10

  environment {
    variables = {
      NOTIFICATION_TOPIC_ARN       = aws_sns_topic.security_alerts.arn
      QUOTAS_TABLE_NAME            = aws_dynamodb_table.security.name
      TWILIO_PARENT_ACCOUNT_SID    = var.twilio_parent_account_sid
      TWILIO_PARENT_AUTH_TOKEN     = var.twilio_parent_auth_token
      TWILIO_SUBACCOUNT_AUTH_TOKEN = var.twilio_auth_token
      TWILIO_SUBACCOUNT_SID        = var.twilio_account_sid
      TWILIO_WEBHOOK_URL           = "https://${aws_apigatewayv2_api.cost_guard.id}.execute-api.${var.aws_region}.amazonaws.com/twilio/usage"
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.cost_guard_lambda_logs,
    aws_iam_role_policy.cost_guard_lambda_policy,
  ]
}

resource "aws_cloudwatch_log_group" "cost_guard_lambda_logs" {
  name              = "/aws/lambda/${local.cost_guard_function_name}"
  retention_in_days = 90
}
