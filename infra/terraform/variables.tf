variable "aws_region" {
  description = "Região da AWS"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Nome base do projeto"
  type        = string
  default     = "portfolio"
}

variable "state_bucket" {
  description = "Nome do bucket de state criado manualmente"
  type        = string
  default     = "fer-oshiro-portfolio-terraform-state"
}

variable "s3_bucket_name" {
  type        = string
  description = "Nome do bucket S3 do portfólio"
  default     = "fer-oshiro-portfolio-drawings"
}

variable "drawings_public_base_url" {
  type        = string
  description = "URL pública base usada para expor desenhos aprovados"

  validation {
    condition     = can(regex("^https://[^/[:space:]]+[^/]$", var.drawings_public_base_url))
    error_message = "drawings_public_base_url deve ser uma origem HTTPS absoluta e sem barra final, por exemplo https://fer-oshiro.com."
  }
}

variable "groq_api_key" {
  description = "A chave secreta da API do Groq"
  type        = string
  sensitive   = true
}

variable "twilio_account_sid" {
  description = "A sid da API do Twilio"
  type        = string
  sensitive   = true
}

variable "twilio_auth_token" {
  description = "A chave secreta da API do Twilio"
  type        = string
  sensitive   = true
}

variable "twilio_parent_account_sid" {
  description = "SID da conta-mãe Twilio usada somente pelo circuit breaker"
  type        = string
  sensitive   = true
}

variable "twilio_parent_auth_token" {
  description = "Auth Token da conta-mãe Twilio usada somente pelo circuit breaker"
  type        = string
  sensitive   = true
}

variable "turnstile_secret_key" {
  description = "Secret key do widget Cloudflare Turnstile"
  type        = string
  sensitive   = true
}

variable "turnstile_hostname" {
  description = "Hostname aceito na validação do Turnstile"
  type        = string
  default     = "fer-oshiro.com"
}

variable "security_alert_email" {
  description = "Email que deve confirmar a assinatura SNS dos alertas financeiros"
  type        = string

  validation {
    condition     = can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", var.security_alert_email))
    error_message = "security_alert_email deve ser um email válido."
  }
}

variable "aws_monthly_budget_usd" {
  description = "Budget mensal em USD para recursos tagueados como pertencentes ao projeto"
  type        = number
  default     = 10

  validation {
    condition     = var.aws_monthly_budget_usd > 0
    error_message = "aws_monthly_budget_usd deve ser positivo."
  }
}

variable "security_max_daily_sessions" {
  description = "Máximo de sessões WebSocket autorizadas por dia UTC"
  type        = number
  default     = 500

  validation {
    condition     = var.security_max_daily_sessions > 0 && floor(var.security_max_daily_sessions) == var.security_max_daily_sessions
    error_message = "security_max_daily_sessions deve ser um inteiro positivo."
  }
}

variable "security_quotas" {
  description = "Quotas anônimas por sessão e globais por dia UTC"
  type = object({
    session = object({
      total        = number
      chat         = number
      get_drawings = number
      join         = number
      save_drawing = number
      signal       = number
      turn         = number
    })
    globalDaily = object({
      total        = number
      chat         = number
      get_drawings = number
      join         = number
      save_drawing = number
      signal       = number
      turn         = number
    })
  })
  default = {
    session = {
      total        = 300
      chat         = 10
      get_drawings = 30
      join         = 6
      save_drawing = 2
      signal       = 200
      turn         = 1
    }
    globalDaily = {
      total        = 5000
      chat         = 100
      get_drawings = 5000
      join         = 5000
      save_drawing = 20
      signal       = 5000
      turn         = 10
    }
  }

  validation {
    condition = alltrue(concat(
      [for value in values(var.security_quotas.session) : value > 0 && floor(value) == value],
      [for value in values(var.security_quotas.globalDaily) : value > 0 && floor(value) == value]
    ))
    error_message = "Todas as quotas devem ser inteiros positivos."
  }
}
