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

variable "groq_api_key" {
  description = "A chave secreta da API do Groq"
  type        = string
  sensitive   = true # Isso oculta a chave nos logs do terraform plan
}
