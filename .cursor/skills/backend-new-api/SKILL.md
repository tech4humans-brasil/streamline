---
name: backend-new-api
description: Add new HTTP API endpoints in the Backend (Azure Functions). Use when creating a new endpoint, route, or resource in Backend, or when asked how to add an API.
---

# Backend — Nova API HTTP

## Objetivo

Adicionar um novo endpoint HTTP no Backend usando o middleware `Http`, repositórios e serviços existentes.

## Passos

### 1. Definir o handler

Criar ficheiro em `Backend/src/functions/apis/<Recurso>/<Nome>.ts` (ex.: `Project/Update.ts`, `Form/Create.ts`).

- Importar `Http` e `HttpHandler` de `../../../middlewares/http`, `res` de `../../../utils/apiResponse`.
- Importar repositórios/serviços e modelos necessários.
- Definir interface para body/params/query quando aplicável.
- Implementar o handler:

```typescript
const handler: HttpHandler = async (conn, req, context) => {
  const { id } = req.params;
  const body = req.body as YourBodyType;

  const repo = new YourRepository(conn);
  const result = await repo.someMethod({ id, ...body });

  if (!result) return res.notFound("Not found");
  return res.success(result);
};
```

- Obter conexão: o middleware injeta `conn` (Mongoose) conforme o utilizador (slug). Para rotas públicas que precisam de DB, usar `connect(client.acronym)` ou `connectAdmin()` dentro do handler (ex.: ver `Auth/Login.ts`).
- Respostas: usar sempre `res` (ex.: `res.success()`, `res.notFound()`, `res.unauthorized()`, `res.error()`).

### 2. Validação (Yup)

Usar `.setSchemaValidator()` com Yup para body, params, query e/ou headers:

```typescript
.setSchemaValidator((schema) => ({
  body: schema.object().shape({
    name: schema.string().required().min(3).max(255),
  }),
  params: schema.object().shape({
    id: schema.string().required(),
  }),
}))
```

### 3. Configurar a rota

Encadear `.configure()` com nome da function, permissão (se aplicável) e opções Azure:

```typescript
.configure({
  name: "ResourceAction",   // Nome único da Azure Function
  permission: "resource.action",  // opcional; omitir para rotas públicas
  options: {
    methods: ["GET"] | ["POST"] | ["PUT"] | ["DELETE"],
    route: "recurso/{id?}",
  },
})
```

- Rotas **públicas** (ex.: login, registo): chamar `.setPublic()` antes de `.configure()`.
- `route`: padrão REST (ex.: `projects/{id}`, `form`, `form/{id}`).

### 4. Exportar

Exportar o resultado da cadeia como default:

```typescript
export default new Http(handler)
  .setSchemaValidator((schema) => ({ ... }))
  .configure({ name: "...", permission: "...", options: { methods, route } });
```

## Checklist

- [ ] Handler em `Backend/src/functions/apis/<Recurso>/`.
- [ ] Tipagem explícita para body/params/query.
- [ ] Uso de repositórios ou serviços; lógica complexa em use-cases se necessário.
- [ ] Validação Yup via `.setSchemaValidator()`.
- [ ] Respostas via `res`; erros tratados (notFound, unauthorized, etc.).
- [ ] `.setPublic()` apenas para rotas não autenticadas.
- [ ] `.configure()` com nome único, permission (se aplicável) e route.

## Referências

- Exemplo completo: `Backend/src/functions/apis/Project/Update.ts`.
- Middleware HTTP: `Backend/src/middlewares/http.ts`.
- Repositórios: `Backend/src/repositories/`; serviços: `Backend/src/services/`.
