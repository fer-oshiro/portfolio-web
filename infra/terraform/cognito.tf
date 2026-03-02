resource "aws_cognito_user_pool" "pool" {
  name = "${var.project_name}-user-pool"
}

resource "aws_cognito_user_pool_client" "client" {
  name         = "${var.project_name}-client"
  user_pool_id = aws_cognito_user_pool.pool.id
}

resource "aws_cognito_identity_pool" "id_pool" {
  identity_pool_name               = "${var.project_name} identity pool"
  allow_unauthenticated_identities = true

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.client.id
    provider_name           = aws_cognito_user_pool.pool.endpoint
    server_side_token_check = false
  }
}

resource "aws_iam_role" "unauthenticated" {
  name = "${var.project_name}-cognito-unauth"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = { Federated = "cognito-identity.amazonaws.com" }
      Condition = {
        "StringEquals" = { "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.id_pool.id }
        "ForAnyValue:StringLike" = { "cognito-identity.amazonaws.com:amr" = "unauthenticated" }
      }
    }]
  })
}

resource "aws_iam_role_policy" "unauth_policy" {
  name = "${var.project_name}-unauth-policy"
  role = aws_iam_role.unauthenticated.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = ["execute-api:Invoke"]
      Effect   = "Allow"
      Resource = ["${aws_apigatewayv2_api.ws.execution_arn}/*"]
    }]
  })
}

resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.id_pool.id
  roles = {
    unauthenticated = aws_iam_role.unauthenticated.arn
  }
}
