---
name: run-and-test-streamline
description: Commands to run and test Backend and Frontend locally and in CI. Use when needing instructions for dev, build, test, or lint for the Streamline project.
---

# Run and test Streamline

## Backend

- **Instalar dependências**: `pnpm install` (na pasta `Backend`).
- **Configuração local**: copiar `local.example.setting.json` para `local.settings.json` e preencher variáveis.
- **Build**: `pnpm run build`.
- **Desenvolvimento**: `pnpm run dev` (clean + build + `func start` com watch).
- **Testes**: `pnpm test` (Jest; ficheiros `**/*.test.ts` e `**/*.spec.ts`). Opcional: `pnpm run test:watch`, `pnpm run test:coverage` se existir no `package.json`).

## Frontend

- **Instalar dependências**: `npm install` (na pasta `Frontend`).
- **Configuração local**: copiar `.env.example` para `.env.local` e preencher (ex.: `VITE_BASE_URL`).
- **Desenvolvimento**: `npm run dev` (Vite).
- **Build**: `npm run build` (tsc --noEmit + vite build).
- **Lint**: `npm run lint` (ESLint em .ts/.tsx).
- **Testes**: `npm test` ou `npm run test:watch` / `npm run test:coverage` se configurados no `package.json`.

## Ordem para desenvolvimento local

1. Terminal 1: `cd Backend && pnpm run dev`
2. Terminal 2: `cd Frontend && npm run dev`

## CI/CD (GitHub Actions)

Workflows em `.github/workflows/`:

- **cd-backend-dev.yml** / **cd-backend-prod.yml**: push em `main` ou tag `v*` (exceto `Frontend/**`) → install (pnpm, Node 20), build, deploy Azure Functions. Jobs de test podem estar comentados.
- **cd-frontend-dev.yml** / **cd-frontend-prod.yml**: push em `main` ou tag `v*` (exceto `Backend/**`) → install (npm), build (Vite com variáveis/segredos), deploy Azure Static Web Apps. Jobs de test podem estar comentados.

Para validar antes de push: executar no Backend `pnpm run build` e `pnpm test`; no Frontend `npm run build`, `npm run lint` e testes se existirem.
