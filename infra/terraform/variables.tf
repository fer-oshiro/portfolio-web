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
