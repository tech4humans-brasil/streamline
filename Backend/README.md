# 🔧 Streamline Backend

Backend da plataforma Streamline construído com **Azure Functions** e **TypeScript**, fornecendo APIs robustas para automação de workflows e gerenciamento de processos.

## 🏗️ Arquitetura

```
├── src/
│   ├── functions/           # Azure Functions (APIs, CRONs, Queues)
│   │   ├── apis/           # Endpoints REST
│   │   ├── crons/          # Tarefas agendadas
│   │   └── queues/         # Processamento assíncrono
│   ├── models/             # Modelos de dados (Mongoose)
│   ├── repositories/       # Camada de acesso a dados
│   ├── services/           # Lógica de negócio
│   ├── use-cases/          # Casos de uso específicos
│   ├── middlewares/        # Middlewares customizados
│   └── utils/              # Utilitários
```

## 🚀 Configuração e Instalação

### Pré-requisitos
- **Node.js** >= 20.0.0
- **Azure Functions Core Tools** v4
- **MongoDB** (local ou Azure Cosmos DB)

### Instalação

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp local.example.setting.json local.settings.json
# Edite local.settings.json com suas configurações

# Desenvolvimento
npm run dev        # Inicia em modo desenvolvimento
npm run build      # Build para produção
npm run test       # Executa testes
```

## ⚙️ Configuração

### Variáveis de Ambiente (local.settings.json)

```json
{
  "IsEncrypted": false,
  "Values": {
    // Configuração de Runtime do Worker Functions (Node.js)
    "FUNCTIONS_WORKER_RUNTIME": "node",

    // Configurações Globais da Azure Functions
    "AzureWebJobsFeatureFlags": "EnableWorkerIndexing",
    "AzureWebJobsStorage": "sua-connection-string-azure-storage-para-webjobs",

    // Configurações de Connection String para Serviços Azure (Azure Storage e Service Bus)
    "AZURE_STORAGE_CONNECTION_STRING": "sua-connection-string-azure-storage-para-aplicacao",
    "AZURE_SERVICE_BUS_CONNECTION_STRING": "sua-connection-string-azure-service-bus",

    // Configurações de Json Web Token (JWT) para Autenticação
    "JWT_SECRET": "seu-jwt-secret-de-autenticacao",
    "JWT_RESET_PASSWORD_SECRET": "seu-jwt-secret-de-reset-de-senha",

    // Configurações de Banco de Dados MongoDB
    "MONGO_ADMIN_DB": "nome-do-banco-de-dados-admin-ou-global",
    "MONGO_URI": "uri-mongodb",
    "MONGO_PARAMS": "parametros-mongodb",

    // Configurações de Email (Remetente e SendGrid)
    "EMAIL_ACCOUNT": "seu-email-de-remetente padrão",
    "SENDGRID_API_KEY": "sua-sendgrid-api-key",

    // Variáveis Diversas (Frontend URL, Logs e Ambiente)
    "FRONTEND_URL": "url-do-seu-frontend",
    "LOGGIN": "true-ou-false",
    "DISCORD_WEBHOOK_URL": "seu-discord-webhook-url",
    "NODE_ENV": "development-ou-production"
  },
  "Host": {
    // Configuração de CORS (Cross-Origin Resource Sharing)
    "CORS": "*"
  }
}
```

## 🔌 Endpoints Principais

### 🔐 Autenticação
```
POST   /api/auth/login           # Login de usuário
POST   /api/auth/register        # Registro de usuário
POST   /api/auth/forgot-password # Recuperação de senha
POST   /api/auth/reset-password  # Reset de senha
```

### 👥 Usuários
```
GET    /api/users               # Listar usuários
GET    /api/users/{id}          # Obter usuário específico
POST   /api/users               # Criar usuário
PUT    /api/users/{id}          # Atualizar usuário
DELETE /api/users/{id}          # Remover usuário
```

### 📋 Atividades
```
GET    /api/activities          # Listar atividades
GET    /api/activities/{id}     # Obter atividade específica
POST   /api/activities          # Criar atividade
PUT    /api/activities/{id}     # Atualizar atividade
DELETE /api/activities/{id}     # Remover atividade
```

### 🔄 Workflows
```
GET    /api/workflows           # Listar workflows
GET    /api/workflows/{id}      # Obter workflow específico
POST   /api/workflows           # Criar workflow
PUT    /api/workflows/{id}      # Atualizar workflow
POST   /api/workflows/{id}/execute # Executar workflow
```

### 📝 Formulários
```
GET    /api/forms               # Listar formulários
GET    /api/forms/{id}          # Obter formulário específico
POST   /api/forms               # Criar formulário
PUT    /api/forms/{id}          # Atualizar formulário
POST   /api/forms/{id}/submit   # Submeter resposta
```

## 🧩 Componentes Principais

### Models
Modelos de dados usando **Mongoose ODM**:
- **Activity**: Atividades do sistema
- **User**: Usuários e autenticação
- **Workflow**: Definições de fluxos
- **Form**: Formulários dinâmicos
- **Project**: Projetos organizacionais

### Services
Serviços especializados:
- **AuthService**: Autenticação JWT
- **EmailService**: Envio de e-mails (SendGrid)
- **WorkflowService**: Execução de workflows
- **NotificationService**: Sistema de notificações
- **StorageService**: Gerenciamento de arquivos

### Repositories
Camada de acesso a dados com padrão Repository:
- Abstração do banco de dados
- Queries otimizadas
- Caching quando necessário

## ⏱️ CRONs e Tarefas Agendadas

### Tarefas Automáticas
```typescript
// Execução de workflows agendados
CronScheduler: "0 */5 * * * *"  // A cada 5 minutos

// Limpeza de dados temporários  
CleanupTask: "0 0 2 * * *"      // Diariamente às 2h

// Relatórios automáticos
ReportGenerator: "0 0 9 * * 1"  // Segundas às 9h
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Cobertura de testes
npm run test:coverage
```

## 🚀 Deploy

### Desenvolvimento

Recomendado: Use o **VS Code** e instale a extensão ofical para **Azure Functions

```bash
# Desenvolvimento local
npm run dev

# Build para produção
npm run build
```

### Produção (Azure)
O deploy é automatizado via **GitHub Actions**:
1. Build da aplicação
2. Testes automatizados
3. Deploy para Azure Functions
4. Configuração de variáveis de ambiente

## 📊 Monitoramento

### Logs e Observabilidade
- **Azure Application Insights**: Métricas e logs
- **Sentry**: Rastreamento de erros
- **Custom Logging**: Logs estruturados

### Health Checks
```
GET /api/ping              # Status da API
GET /api/health/database   # Status do banco
GET /api/health/external   # Status de serviços externos
```

## 🔒 Segurança

### Autenticação
- **JWT Tokens** com expiração configurável
- **Refresh Tokens** para sessões longas
- **Password Hashing** com bcrypt

### Autorização
- **Role-based Access Control (RBAC)**
- **Permission System** granular
- **Request Rate Limiting**

### Validação
- **Input Validation** com Yup
- **Schema Validation** para todas as APIs
- **Sanitização** automática de dados

## 🤝 Contribuindo

1. **Clone** o repositório
2. **Instale** as dependências: `npm install`
3. **Configure** o ambiente local
4. **Execute** os testes: `npm test`
5. **Crie** sua feature branch
6. **Commit** seguindo [Conventional Commits](https://conventionalcommits.org/)
7. **Abra** um Pull Request

### Padrões de Código
- **ESLint** para linting
- **Prettier** para formatação
- **TypeScript** strict mode
- **Conventional Commits** para mensagens

## 📝 Scripts Disponíveis

```bash
npm run build      # Build TypeScript
npm run watch      # Watch mode para desenvolvimento
npm run clean      # Limpar arquivos de build
npm run dev        # Desenvolvimento (build + start + watch)
npm start          # Iniciar Azure Functions
npm test           # Executar testes
npm run lint       # Linting do código
```

## 🆘 Troubleshooting

### Problemas Comuns

**Erro de conexão com MongoDB:**
```bash
# Verificar se MongoDB está rodando
mongod --version

# Testar conexão
mongo "sua-connection-string"
```

**Azure Functions não inicializam:**
```bash
# Verificar versão do Core Tools
func --version

# Reinstalar se necessário
npm install -g azure-functions-core-tools@4
```

**Problemas de autenticação:**
- Verificar JWT_SECRET no local.settings.json
- Confirmar se as datas de expiração estão corretas
- Validar formato dos tokens

---

Para mais informações, consulte a [documentação completa](../docs/backend/README.md) ou abra uma [issue](https://github.com/your-org/streamline/issues).
