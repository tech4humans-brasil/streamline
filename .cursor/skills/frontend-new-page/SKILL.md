---
name: frontend-new-page
description: Add new page or flow in the Frontend (React). Use when creating a new page, route, or section in Frontend, or when asked how to add a page or screen.
---

# Frontend — Nova página ou fluxo

## Objetivo

Adicionar uma nova página (ou secção) no Frontend, com rota, componentes e dados do servidor quando necessário.

## Passos

### 1. Criar a página

Criar pasta e ficheiro em `Frontend/src/pages/<Domínio>/<Nome>.tsx` (ex.: `Portal/Forms/Form.tsx`, `Equipment/Equipments/Equipment.tsx`).

- Usar componentes funcionais com props tipadas (interface).
- Usar Chakra UI para layout e componentes; tema em `src/styles/theme.ts`.
- Para dados remotos: TanStack React Query (`useQuery`, `useMutation`, `QueryClient`) e APIs em `src/apis/` ou `src/services/`.
- Usar aliases: `@pages`, `@components`, `@hooks`, `@services`, etc. (ver `vite.config.ts` e `tsconfig.json`).

### 2. Componentes reutilizáveis

- **Atoms**: `Frontend/src/components/atoms/` — elementos básicos.
- **Molecules**: `Frontend/src/components/molecules/` — combinações de atoms.
- **Organisms**: `Frontend/src/components/organisms/` — blocos maiores com lógica.

Colocar cada componente na camada adequada; evitar colocar tudo na página.

### 3. Registrar a rota

- **Rotas privadas**: editar `Frontend/src/routes/private.tsx`.
- **Rotas públicas**: editar `Frontend/src/routes/public.tsx`.

Estrutura de entrada no array de rotas:

```typescript
{
  path: "/portal/...",
  element: <YourPage />,
  permission: "optional.permission.key",  // opcional
  children: [ ... ],  // opcional
}
```

- Importar a página com alias: `import YourPage from "@pages/Domain/YourPage";`
- Tipo `RouteType` definido em `Frontend/src/routes/index.tsx` (`path`, `element`, `permission`, `children`).

### 4. Integrar no layout

Se a nova rota for filha de uma rota existente (ex.: dentro de `/portal`), adicionar como `children` do objeto correspondente em `private.tsx` (ou `public.tsx`). Para rotas de primeiro nível, adicionar novo objeto ao array.

### 5. Dados e permissões

- Chamadas à API: usar React Query; definir ou reutilizar funções em `apis/` ou `services/`.
- Permissões: usar o campo `permission` na rota; o contexto de auth e o router tratam o acesso.
- Contextos globais: `AuthContext`, `DrawerContext` em `src/contexts/`.

## Checklist

- [ ] Página em `Frontend/src/pages/<Domínio>/`.
- [ ] Props tipadas; sem `any` em componentes.
- [ ] Rota registada em `private.tsx` ou `public.tsx` com path e element.
- [ ] Componentes em atoms/molecules/organisms quando reutilizáveis.
- [ ] Dados via React Query e serviços/apis; Chakra para UI.
- [ ] Executar `npm run lint` no Frontend antes de commitar.

## Referências

- Rotas: `Frontend/src/routes/private.tsx`, `Frontend/src/routes/index.tsx`.
- Exemplo de página com Query: `Frontend/src/pages/Portal/Forms/Form.tsx`.
- Componentes: `Frontend/src/components/atoms/`, `molecules/`, `organisms/`.
