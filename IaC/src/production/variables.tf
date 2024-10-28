variable "FRONTEND_URL" {
  type        = string
  description = "URL do Frontend"
}

variable "JWT_SECRET" {
  type        = string
  description = "Segredo JWT para autenticação"
}

variable "JWT_RESET_PASSWORD_SECRET" {
  type        = string
  description = "Segredo JWT para resetar senha"
}

variable "NODE_ENV" {
  type        = string
  description = "Ambiente de execução"
  default     = "production"
}

variable "LOCATION" {
  type        = string
  description = "Localização dos recursos"
  default     = "eastus2"
}

variable "RESOURCE_GROUP" {
  type        = string
  description = "Grupo de recursos"
}

variable "SENDGRID_API_KEY" {
  type        = string
  description = "Chave da API do SendGrid"
}

variable "EMAIL_ACCOUNT" {
  type        = string
  description = "Conta de email"
}

variable "DISCORD_WEBHOOK_URL" {
  type        = string
  description = "URL do Webhook do Discord"
}
