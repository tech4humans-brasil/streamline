# 🚀 Streamline

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)
[![Azure Functions](https://img.shields.io/badge/Azure-Functions-blue.svg)](https://azure.microsoft.com/services/functions/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)

**Streamline** é uma plataforma completa de automação de processos e workflows, projetada para reduzir o TOIL (Trabalho Operacional Desnecessário) e melhorar a eficiência organizacional através de fluxos de trabalho automatizados e inteligentes.

![Streamline Architecture](docs/images/architecture-overview.png)

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
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "MONGO_URI": "sua-string-conexao-mongodb",
    "JWT_SECRET": "seu-jwt-secret-super-seguro",
    "FRONTEND_URL": "http://localhost:5173",
    "SENDGRID_API_KEY": "sua-chave-sendgrid",
    "NODE_ENV": "development"
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

## 📚 Documentação

### Guias de Uso
- [🎯 **Criando seu Primeiro Workflow**](docs/guides/first-workflow.md)
- [📋 **Configurando Formulários**](docs/guides/forms-setup.md)
- [⚙️ **Integrações e APIs**](docs/guides/integrations.md)
- [👥 **Gerenciamento de Usuários**](docs/guides/user-management.md)

### Referência Técnica
- [🔌 **API Reference**](docs/api/README.md)
- [🏗️ **Arquitetura Detalhada**](docs/architecture/README.md)
- [🧩 **Componentes de Workflow**](docs/components/README.md)
- [🚀 **Deploy e Produção**](docs/deployment/README.md)

### Desenvolvimento
- [💻 **Guia de Desenvolvimento**](docs/development/README.md)
- [🧪 **Testes**](docs/development/testing.md)
- [🎨 **Padrões de Código**](docs/development/code-standards.md)

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

## 📊 Roadmap

### 🎯 Próximimas Funcionalidades
- [ ] **Mobile App** - Aplicativo React Native
- [ ] **Plugin System** - Sistema de plugins extensível
- [ ] **AI Integration** - Assistente IA para criação de workflows
- [ ] **Advanced Analytics** - Dashboards mais robustos
- [ ] **Multi-tenancy** - Suporte para múltiplas organizações

### 🔄 Melhorias Planejadas
- [ ] **Performance** - Otimizações de renderização
- [ ] **Accessibility** - Melhor suporte para acessibilidade
- [ ] **Internationalization** - Suporte para mais idiomas
- [ ] **Real-time Updates** - WebSockets para atualizações em tempo real

## 🆘 Suporte

### 💬 Comunidade
- **GitHub Discussions**: Para perguntas e discussões gerais
- **GitHub Issues**: Para bugs e requests de features
- **Discord**: [Junte-se ao nosso servidor](https://discord.gg/streamline)

### 📧 Contato
- **Email**: team@streamline.dev
- **Website**: https://streamline.dev
- **Blog**: https://blog.streamline.dev

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

<div align="center">

**⭐ Se este projeto foi útil para você, considere dar uma estrela!**

Feito com ❤️ pela equipe [Tech4H](https://github.com/tech4h)

</div>