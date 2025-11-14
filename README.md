# 🚀 Streamline

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)
[![Azure Functions](https://img.shields.io/badge/Azure-Functions-blue.svg)](https://azure.microsoft.com/services/functions/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)

**Streamline** é uma plataforma completa de automação de processos e workflows, projetada para reduzir o TOIL (Trabalho Operacional Desnecessário) e melhorar a eficiência organizacional através de fluxos de trabalho automatizados e inteligentes.

### Para guias, tutoriais e outras informações, consulte a [Streamline Wiki](https://github.com/tech4humans-brasil/streamline/wiki)

## ✨ Principais Funcionalidades

### 🔄 **Automação de Workflows**
- **Editor Visual de Fluxos**: Interface drag-and-drop para criar workflows complexos
- **Blocos de Automação**: Componentes reutilizáveis para diferentes tipos de tarefas
- **Execução Condicional**: Lógica de bifurcação baseada em critérios configuráveis
- **Integração com APIs**: Conectores para sistemas externos via webhooks e REST APIs

### 📋 **Gestão de Atividades**
- **Formulários Dinâmicos**: Criação de formulários customizáveis para captura de dados
- **Ciclo de Vida Completo**: Acompanhamento desde criação até conclusão
- **Estados Configuráveis**: Definição de status personalizados para cada processo
- **Timeline Interativa**: Visualização cronológica de todas as interações

### 🎯 **Recursos Avançados**
- **Agendamento Inteligente**: Execução automatizada baseada em cronogramas e eventos
- **Sistema de Notificações**: E-mails automáticos e webhooks para Discord/Slack
- **Relatórios e Analytics**: Dashboards com métricas de desempenho e SLAs
- **Controle de Acesso**: Sistema robusto de permissões e roles

## 🏗️ Arquitetura

O Streamline é construído com uma arquitetura moderna e escalável:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Frontend     │────│    Backend      │────│   Database      │
│   React + TS    │    │ Azure Functions │    │    MongoDB      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │                 │
                       │ Infrastructure  │
                       │   Terraform     │
                       │                 │
                       └─────────────────┘
```

### 🔧 **Stack Tecnológico**

#### Frontend
- **React 18.3** com TypeScript
- **Chakra UI** para componentes visuais
- **React Query** para gerenciamento de estado servidor
- **React Flow** para editor visual de workflows
- **Vite** como bundler moderno

#### Backend
- **Azure Functions** com Node.js 20
- **TypeScript** para type safety
- **MongoDB** com Mongoose ODM
- **JWT** para autenticação
- **SendGrid** para e-mails transacionais

#### Infraestrutura
- **Terraform** para Infrastructure as Code
- **Azure** como provedor de nuvem
- **GitHub Actions** para CI/CD
- **Sentry** para monitoramento de erros

## 🚀 Instalação e Configuração

### Pré-requisitos
- **Node.js** >= 20.0.0
- **npm** ou **pnpm**
- **MongoDB** (local ou cloud)
- **Azure Functions Core Tools** (para backend)

### 1. Clone o Repositório
```bash
git clone https://github.com/your-org/streamline.git
cd streamline
```

### 2. Configuração do Backend

```bash
cd Backend
npm install

# Configure as variáveis de ambiente
cp local.example.setting.json local.settings.json
# Edite local.settings.json com suas configurações
```

**Variáveis de Ambiente Necessárias:**
```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsFeatureFlags": "EnableWorkerIndexing",
    "AzureWebJobsStorage": "sua-connection-string-azure-storage-para-webjobs",
    "AZURE_STORAGE_CONNECTION_STRING": "sua-connection-string-azure-storage-para-aplicacao",
    "AZURE_SERVICE_BUS_CONNECTION_STRING": "sua-connection-string-azure-service-bus",
    "JWT_SECRET": "seu-jwt-secret-de-autenticacao",
    "JWT_RESET_PASSWORD_SECRET": "seu-jwt-secret-de-reset-de-senha",
    "MONGO_ADMIN_DB": "nome-do-banco-de-dados-admin-ou-global",
    "FRONTEND_URL": "url-do-seu-frontend",
    "MONGO_URI": "uri-mongodb",
    "MONGO_PARAMS": "parametros-mongodb",
    "EMAIL_ACCOUNT": "seu-email-de-remetente padrão",
    "SENDGRID_API_KEY": "sua-sendgrid-api-key",
    "LOGGIN": "true-ou-false",
    "DISCORD_WEBHOOK_URL": "seu-discord-webhook-url",
    "NODE_ENV": "development-ou-production"
  },
  "Host": {
    "CORS": "*"
  }
}
```

**Inicie o backend:**
```bash
npm run dev
```

### 3. Configuração do Frontend

```bash
cd Frontend
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações
```

**Variáveis de Ambiente do Frontend:**
```env
VITE_BASE_URL=http://localhost:7071/api
VITE_GOOGLE_CLIENT_ID=seu-google-client-id
```

**Inicie o frontend:**
```bash
npm run dev
```

### 4. Acesse a Aplicação
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:7071/api

## 🤝 Contribuindo

Adoramos contribuições! Veja nosso [Guia de Contribuição](CONTRIBUTING.md) para detalhes sobre:

- 🐛 **Reportar bugs**
- 💡 **Sugerir funcionalidades**
- 🔧 **Enviar pull requests**
- 📝 **Melhorar documentação**

### Desenvolvimento Local

1. **Fork** o repositório
2. **Clone** seu fork
3. **Crie** uma branch para sua feature: `git checkout -b feature/minha-feature`
4. **Commit** suas mudanças: `git commit -m 'feat: adiciona nova funcionalidade'`
5. **Push** para a branch: `git push origin feature/minha-feature`
6. **Abra** um Pull Request

### 📧 Contato
- **Nome**: Luis Ricardo
- **Email**: luis.ricardo@tech4h.com.br

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

<div align="center">

**⭐ Se este projeto foi útil para você, considere dar uma estrela!**

</div>
