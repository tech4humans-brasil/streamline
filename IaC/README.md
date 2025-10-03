# 🏗️ Streamline Infrastructure as Code

Configuração de infraestrutura do Streamline usando **Terraform** para provisionamento automatizado na **Azure**.

## 🎯 Visão Geral

Esta pasta contém toda a configuração necessária para provisionar a infraestrutura do Streamline na Azure:

- **Azure Functions** para Backend
- **Azure Static Web Apps** para Frontend  
- **Azure Cosmos DB** para banco de dados
- **Azure Service Bus** para mensageria
- **Azure Storage** para arquivos
- **Application Insights** para monitoramento

## 🏗️ Estrutura

```
IaC/
├── src/
│   └── production/
│       ├── main.tf          # Configuração principal
│       └── variables.tf     # Variáveis de entrada
├── Dockerfile              # Container para execução do Terraform
└── README.md               # Esta documentação
```

## 🚀 Recursos Provisionados

### Core Infrastructure
- **Resource Group**: Agrupamento de recursos
- **Storage Accounts**: Armazenamento de arquivos e logs
- **Service Plan**: Plano de hospedagem para Azure Functions

### Backend Services
- **Azure Functions**: Runtime serverless para APIs
- **Cosmos DB**: Banco de dados MongoDB compatível
- **Service Bus**: Sistema de mensageria para filas

### Frontend Services
- **Static Web Apps**: Hospedagem do frontend React
- **CDN**: Distribuição global de conteúdo

### Monitoring & Security
- **Application Insights**: Monitoramento e telemetria
- **Key Vault**: Gerenciamento seguro de secrets
- **Managed Identity**: Autenticação entre serviços

## ⚙️ Configuração

### Pré-requisitos

1. **Azure CLI** instalado e configurado
2. **Terraform** >= 1.0
3. **Docker** (para execução em container)

### Autenticação Azure

```bash
# Fazer login na Azure
az login

# Verificar assinatura ativa
az account show

# Definir assinatura específica (se necessário)
az account set --subscription "sua-subscription-id"
```

### Configuração de Variáveis

Crie um arquivo `terraform.tfvars` em `src/production/`:

```hcl
# terraform.tfvars
RESOURCE_GROUP    = "rg-streamline-prod"
LOCATION         = "East US 2"
FRONTEND_URL     = "https://sua-app.azurestaticapps.net"

# Secrets (gerados automaticamente ou fornecidos)
JWT_SECRET                = "seu-jwt-secret-super-seguro"
JWT_RESET_PASSWORD_SECRET = "outro-secret-para-reset"
SENDGRID_API_KEY         = "sua-chave-sendgrid"
EMAIL_ACCOUNT            = "noreply@suaempresa.com"
DISCORD_WEBHOOK_URL      = "https://discord.com/api/webhooks/..."
```

## 🐳 Deploy com Docker

### Método Recomendado

```bash
# Build da imagem Terraform
docker build -t streamline-terraform .

# Executar Terraform dentro do container
docker run -it --rm \
  -v $(pwd)/src:/workspace \
  -v ~/.azure:/root/.azure:ro \
  streamline-terraform

# Dentro do container:
cd production
terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"
```

### Método Local

```bash
cd src/production

# Inicializar Terraform
terraform init

# Planejar mudanças
terraform plan -var-file="terraform.tfvars"

# Aplicar configuração
terraform apply -var-file="terraform.tfvars"
```

## 📋 Variáveis de Configuração

### Variáveis Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `RESOURCE_GROUP` | Nome do resource group | `rg-streamline-prod` |
| `LOCATION` | Região da Azure | `East US 2` |
| `FRONTEND_URL` | URL do frontend | `https://app.streamline.dev` |
| `JWT_SECRET` | Secret para tokens JWT | `random-secure-string` |
| `SENDGRID_API_KEY` | Chave da API SendGrid | `SG.xxxxx` |
| `EMAIL_ACCOUNT` | Conta de email | `noreply@empresa.com` |

### Variáveis Opcionais

| Variável | Descrição | Padrão |
|----------|-----------|---------|
| `NODE_ENV` | Ambiente de execução | `production` |
| `DISCORD_WEBHOOK_URL` | Webhook Discord | `` |

## 🔧 Recursos Criados

### 1. Storage Account (Funções)
```hcl
resource "azurerm_storage_account" "func-storage" {
  name                     = "streamlinestore${random_id.suffix.hex}"
  resource_group_name      = azurerm_resource_group.rg.name
  location                = azurerm_resource_group.rg.location
  account_tier            = "Standard"
  account_replication_type = "LRS"
}
```

### 2. Azure Functions
```hcl
resource "azurerm_linux_function_app" "function_apps" {
  name                = "streamline-services"
  resource_group_name = azurerm_resource_group.rg.name
  location           = azurerm_resource_group.rg.location
  service_plan_id    = azurerm_service_plan.service_plan.id
  
  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME" = "node"
    "JWT_SECRET"              = var.JWT_SECRET
    "MONGO_URI"               = local.MONGO_URI
    # ... outras configurações
  }
}
```

### 3. Cosmos DB
```hcl
resource "azurerm_cosmosdb_account" "cosmos" {
  name                = "streamline-cosmosdb"
  location           = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  offer_type         = "Standard"
  kind               = "MongoDB"
  
  capabilities {
    name = "EnableMongo"
  }
}
```

### 4. Static Web App
```hcl
resource "azurerm_static_web_app" "static" {
  name                = "streamline-frontend"
  resource_group_name = azurerm_resource_group.rg.name
  location           = "West US 2"
  sku_tier           = "Standard"
  sku_size           = "Standard"
}
```

## 🔒 Segurança

### Secrets Management
- **Terraform State**: Armazenado remotamente na Azure
- **Sensitive Variables**: Marcadas como sensitive
- **Access Control**: RBAC configurado automaticamente

### Network Security
- **CORS**: Configurado entre frontend e backend
- **HTTPS**: Forçado em todos os endpoints
- **Managed Identity**: Autenticação sem senhas

## 📊 Monitoring

### Application Insights
```hcl
resource "azurerm_application_insights" "log" {
  name                = "streamline-insights"
  location           = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  application_type   = "web"
}
```

### Métricas Coletadas
- **Performance**: Tempo de resposta das APIs
- **Errors**: Taxa de erro e stack traces
- **Usage**: Métricas de utilização
- **Custom**: Métricas específicas da aplicação

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/infrastructure.yml
name: Deploy Infrastructure
on:
  push:
    branches: [main]
    paths: ['IaC/**']

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Terraform Apply
        run: |
          docker build -t terraform-runner IaC/
          docker run --rm \
            -v ${{ github.workspace }}/IaC/src:/workspace \
            terraform-runner
```

## 🧪 Ambientes

### Development
```bash
# Usar workspace separado
terraform workspace new development
terraform workspace select development

# Aplicar com variáveis de dev
terraform apply -var-file="dev.tfvars"
```

### Production
```bash
terraform workspace select production
terraform apply -var-file="prod.tfvars"
```

## 💰 Custos Estimados

### Recursos Base (USD/mês)
- **Azure Functions**: $0-5 (consumption plan)
- **Static Web Apps**: $0-10 (standard tier)
- **Cosmos DB**: $25-100 (dependendo do uso)
- **Storage Account**: $1-5
- **Application Insights**: $0-20

**Total Estimado**: $25-140/mês (variável com uso)

## 🆘 Troubleshooting

### Problemas Comuns

**Erro de autenticação:**
```bash
# Renovar login Azure
az login --force

# Verificar permissões
az role assignment list --assignee $(az account show --query user.name -o tsv)
```

**Conflito de recursos:**
```bash
# Importar recurso existente
terraform import azurerm_resource_group.rg /subscriptions/.../resourceGroups/...

# Atualizar state
terraform refresh
```

**Falha no deploy:**
```bash
# Verificar logs detalhados
terraform apply -auto-approve -detailed-exitcode

# Debug mode
TF_LOG=DEBUG terraform apply
```

## 🔄 Backup e Recovery

### State Backup
```bash
# Backup manual do state
terraform state pull > backup-$(date +%Y%m%d).tfstate

# Restaurar state
terraform state push backup-20241003.tfstate
```

### Disaster Recovery
1. **Resources**: Todos os recursos são recriáveis via Terraform
2. **Data**: Cosmos DB com backup automático
3. **Code**: Versionado no Git

## 📝 Próximos Passos

- [ ] **Multi-region**: Deploy em múltiplas regiões
- [ ] **Auto-scaling**: Configuração de escalabilidade automática
- [ ] **Security**: Key Vault para todos os secrets
- [ ] **Monitoring**: Alertas customizados
- [ ] **Backup**: Estratégia de backup automatizada

---

Para mais informações sobre infraestrutura, consulte a [documentação técnica](../docs/infrastructure/README.md) ou abra uma [issue](https://github.com/tech4h/streamline/issues).
