# 📜 Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added
- Documentação completa para open source
- README detalhado com guias de instalação
- Guia de contribuição (CONTRIBUTING.md)
- Licença MIT
- Templates de configuração (.env.example)

### Changed
- READMEs atualizados para Backend, Frontend e IaC
- Estrutura de documentação melhorada

## [1.0.0] - 2024-10-03

### Added
- **Backend**: Sistema completo de APIs com Azure Functions
  - Autenticação JWT
  - CRUD de usuários, atividades, workflows
  - Sistema de formulários dinâmicos
  - Integração com SendGrid para emails
  - Suporte a webhooks e integrações
  
- **Frontend**: Interface React moderna
  - Editor visual de workflows (drag & drop)
  - Dashboards interativos
  - Formulários dinâmicos
  - Sistema de notificações
  - Suporte a temas claro/escuro
  
- **Infrastructure**: Terraform para Azure
  - Provisionamento automatizado
  - Cosmos DB para persistência
  - Azure Functions para backend
  - Static Web Apps para frontend
  - Application Insights para monitoramento

### Features Principais
- 🔄 **Automação de Workflows**: Editor visual para criar fluxos automatizados
- 📋 **Gestão de Atividades**: Ciclo completo de vida das atividades
- 👥 **Controle de Acesso**: Sistema robusto de permissões
- 📊 **Analytics**: Dashboards e relatórios de performance
- 🌐 **Multi-idioma**: Suporte a português e inglês
- 📱 **Responsivo**: Interface adaptável para mobile e desktop

### Technical Stack
- **Backend**: TypeScript, Azure Functions, MongoDB, JWT
- **Frontend**: React 18, TypeScript, Chakra UI, React Query
- **Infrastructure**: Terraform, Azure Cloud
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry, Application Insights

---

## Formato das Entradas

### Types of changes
- `Added` para novas funcionalidades
- `Changed` para mudanças em funcionalidades existentes  
- `Deprecated` para funcionalidades que serão removidas
- `Removed` para funcionalidades removidas
- `Fixed` para correções de bugs
- `Security` para correções de vulnerabilidades
