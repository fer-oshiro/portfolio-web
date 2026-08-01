resource "aws_s3_bucket" "portfolio_bucket" {
  bucket = var.s3_bucket_name

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_policy" "drawings_policy" {
  bucket = aws_s3_bucket.portfolio_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.portfolio_bucket.arn}/gallery/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.portfolio.arn
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_cors_configuration" "portfolio_bucket" {
  bucket = aws_s3_bucket.portfolio_bucket.id

  cors_rule {
    allowed_origins = ["*"]
    allowed_methods = ["PUT", "POST", "GET", "HEAD"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_public_access_block" "portfolio_bucket" {
  bucket = aws_s3_bucket.portfolio_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "portfolio_bucket" {
  bucket = aws_s3_bucket.portfolio_bucket.id

  rule {
    id     = "expire-pending"
    status = "Enabled"

    filter {
      prefix = "submissions/"
    }

    expiration {
      days = 30 # apaga automaticamente após 30 dias se não aprovado
    }
  }
}

resource "aws_s3_bucket" "site_static" {
  bucket = "fer-oshiro-portfolio"

  lifecycle {
    prevent_destroy = true
  }
}
