resource "aws_dynamodb_table" "connections" {
  name         = "${var.project_name}-connections"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "connectionId"

  attribute {
    name = "connectionId"
    type = "S"
  }

  attribute {
    name = "roomId"
    type = "S"
  }

  global_secondary_index {
    name            = "roomId-index"
    hash_key        = "roomId"
    range_key       = "connectionId"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = {
    Project = var.project_name
  }
}

resource "aws_dynamodb_table" "security" {
  name         = "${var.project_name}-security"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "key"

  attribute {
    name = "key"
    type = "S"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }
}
