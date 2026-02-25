# Streamline — Contexto para o agente

O **Streamline** é uma plataforma de automação de processos e workflows, pensada para reduzir TOIL e melhorar a eficiência organizacional.

## Stack

- **Backend**: Node 20, TypeScript, Azure Functions v4, Mongoose (MongoDB). pnpm, Jest.
- **Frontend**: React 18, TypeScript, Vite, Chakra UI, React Query. npm, ESLint.
- **IaC**: Terraform (Azure). Variáveis em `variables.tf`, valores em `terraform.tfvars` (não versionado).

## Onde está o quê

- **API e funções**: `Backend/src/` — `functions/apis/`, `repositories/`, `services/`, `models/`, `middlewares/`, `use-cases/`.
- **Interface**: `Frontend/src/` — `pages/`, `components/` (atoms, molecules, organisms), `routes/`, `apis/`, `contexts/`, `styles/`.
- **Infraestrutura**: `IaC/src/production/` — `main.tf`, `variables.tf`.

## Convenções e PR

- **Commits**: Conventional Commits (feat, fix, docs, style, refactor, test, chore). Ver [CONTRIBUTING.md](CONTRIBUTING.md).
- **Código e PR**: Padrões de código Backend/Frontend e checklist de PR (testes, lint, TypeScript, docs, issues) em [CONTRIBUTING.md](CONTRIBUTING.md).

## Regras e skills do projeto

- **Regras**: `.cursor/rules/` — visão geral, TypeScript, React/Frontend, Backend Azure Functions, Terraform, commits e PR. Aplicam-se por tipo de ficheiro ou sempre (alwaysApply).
- **Skills**: `.cursor/skills/` — fluxos para adicionar nova API no Backend, nova página no Frontend, e comandos para correr/testar o projeto.

Usar as regras e skills ao editar código ou ao explicar como fazer alterações no Streamline.
