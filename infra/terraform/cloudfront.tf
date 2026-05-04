resource "aws_cloudfront_distribution" "portfolio" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "shell/index.html"
  aliases             = ["fer-oshiro.com"]

  tags = {
    Name = "portfolio"
  }

  web_acl_id = "arn:aws:wafv2:us-east-1:121620439865:global/webacl/CreatedByCloudFront-d1893da4/48d1cf21-fab0-4726-b082-0d93b0ade40d"

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/shell/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/shell/index.html"
    error_caching_min_ttl = 10
  }

  origin {
    domain_name              = "fer-oshiro-portfolio.s3.us-east-1.amazonaws.com"
    origin_id                = "fer-oshiro-portfolio.s3.us-east-1.amazonaws.com-mmf5wzx72lg"
    origin_access_control_id = "E17ZQYJ0D6TEYF"
  }

  origin {
    domain_name              = "fer-oshiro-portfolio-drawings.s3.us-east-1.amazonaws.com"
    origin_id                = "drawings-bucket"
    origin_access_control_id = "E17ZQYJ0D6TEYF"
  }

  ordered_cache_behavior {
    path_pattern           = "/gallery/*"
    target_origin_id       = "drawings-bucket"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]

    cache_policy_id            = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    origin_request_policy_id   = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"
    response_headers_policy_id = "60669652-455b-4ae9-85a4-c4c02393f86c"
  }

  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "fer-oshiro-portfolio.s3.us-east-1.amazonaws.com-mmf5wzx72lg"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    origin_request_policy_id   = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"
    cache_policy_id            = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    response_headers_policy_id = "60669652-455b-4ae9-85a4-c4c02393f86c"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = "arn:aws:acm:us-east-1:121620439865:certificate/db90a574-54e9-46ad-ac15-797b5439af39"
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
