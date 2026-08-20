resource "aws_sns_topic" "security_alerts" {
  name = "${var.project_name}-security-alerts"
}

resource "aws_sns_topic_subscription" "security_alert_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.security_alert_email
}

resource "aws_sns_topic_policy" "security_alerts" {
  arn = aws_sns_topic.security_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AccountOwner"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action = [
          "SNS:AddPermission",
          "SNS:DeleteTopic",
          "SNS:GetTopicAttributes",
          "SNS:ListSubscriptionsByTopic",
          "SNS:Publish",
          "SNS:RemovePermission",
          "SNS:SetTopicAttributes",
          "SNS:Subscribe",
        ]
        Resource = aws_sns_topic.security_alerts.arn
      },
      {
        Sid       = "BudgetsPublish"
        Effect    = "Allow"
        Principal = { Service = "budgets.amazonaws.com" }
        Action    = "SNS:Publish"
        Resource  = aws_sns_topic.security_alerts.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

resource "aws_budgets_budget" "project" {
  name         = "${var.project_name}-monthly"
  budget_type  = "COST"
  limit_amount = tostring(var.aws_monthly_budget_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "TagKeyValue"
    values = [format("user:Project$%s", var.project_name)]
  }

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 50
    threshold_type            = "PERCENTAGE"
    notification_type         = "FORECASTED"
    subscriber_sns_topic_arns = [aws_sns_topic.security_alerts.arn]
  }

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.security_alerts.arn]
  }

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.security_alerts.arn]
  }

  depends_on = [aws_sns_topic_policy.security_alerts]
}

locals {
  protected_lambdas = {
    authorizer = aws_lambda_function.ws_authorizer.function_name
    chat       = aws_lambda_function.chat_handler.function_name
    drawing    = aws_lambda_function.draw_handler.function_name
    signaling  = aws_lambda_function.ws_handler.function_name
    cost_guard = aws_lambda_function.cost_guard.function_name
  }

  quota_log_groups = {
    chat      = aws_cloudwatch_log_group.chat_lambda_logs.name
    drawing   = aws_cloudwatch_log_group.draw_lambda_logs.name
    signaling = aws_cloudwatch_log_group.lambda_logs.name
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = local.protected_lambdas

  alarm_name          = "${var.project_name}-${each.key}-errors"
  alarm_description   = "A Lambda protegida ${each.key} registrou erro."
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  dimensions = {
    FunctionName = each.value
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  for_each = local.protected_lambdas

  alarm_name          = "${var.project_name}-${each.key}-throttles"
  alarm_description   = "A Lambda protegida ${each.key} foi limitada pela concorrência reservada."
  namespace           = "AWS/Lambda"
  metric_name         = "Throttles"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  dimensions = {
    FunctionName = each.value
  }
}

resource "aws_cloudwatch_log_metric_filter" "quota_rejected" {
  for_each = local.quota_log_groups

  name           = "${var.project_name}-${each.key}-quota-rejected"
  pattern        = "{ $.securityEvent = \"quota_rejected\" }"
  log_group_name = each.value

  metric_transformation {
    name      = "QuotaRejected"
    namespace = "${var.project_name}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "quota_rejected" {
  alarm_name          = "${var.project_name}-quota-rejected"
  alarm_description   = "Uma quota pública de sessão ou diária foi atingida."
  namespace           = "${var.project_name}/Security"
  metric_name         = "QuotaRejected"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
}

resource "aws_cloudwatch_log_metric_filter" "session_quota_rejected" {
  name           = "${var.project_name}-session-quota-rejected"
  pattern        = "{ $.securityEvent = \"session_quota_rejected\" }"
  log_group_name = aws_cloudwatch_log_group.authorizer_lambda_logs.name

  metric_transformation {
    name      = "QuotaRejected"
    namespace = "${var.project_name}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "turnstile_denied" {
  name           = "${var.project_name}-turnstile-denied"
  pattern        = "{ $.securityEvent = \"authorizer_denied\" }"
  log_group_name = aws_cloudwatch_log_group.authorizer_lambda_logs.name

  metric_transformation {
    name      = "TurnstileDenied"
    namespace = "${var.project_name}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "turnstile_denied" {
  alarm_name          = "${var.project_name}-turnstile-denied-spike"
  alarm_description   = "O authorizer negou 20 ou mais conexões em cinco minutos."
  namespace           = "${var.project_name}/Security"
  metric_name         = "TurnstileDenied"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 20
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
}
