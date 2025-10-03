# 🎨 Streamline Frontend

Interface moderna e intuitiva da plataforma Streamline, construída com **React**, **TypeScript** e **Chakra UI**, oferecendo uma experiência de usuário excepcional para automação de workflows.

## ✨ Características Principais

### 🎯 **Interface Intuitiva**
- **Design System** consistente com Chakra UI
- **Modo Escuro/Claro** adaptável
- **Responsividade** completa para mobile e desktop
- **Acessibilidade** seguindo padrões WCAG

### 🔄 **Editor Visual de Workflows**
- **Drag & Drop** para criação de fluxos
- **Componentes Visuais** para cada tipo de bloco
- **Preview em Tempo Real** das configurações
- **Validação Visual** de conexões e regras

### 📊 **Dashboards Interativos**
- **Métricas em Tempo Real** de performance
- **Gráficos Dinâmicos** com ApexCharts
- **Filtros Avançados** para análise de dados
- **Exportação** de relatórios

## 🏗️ Arquitetura

```
src/
├── components/          # Componentes reutilizáveis
│   ├── atoms/          # Componentes básicos
│   ├── molecules/      # Componentes compostos
│   └── organisms/      # Componentes complexos
├── pages/              # Páginas da aplicação
├── hooks/              # Custom hooks
├── contexts/           # Contextos React
├── services/           # Serviços e APIs
├── utils/              # Utilitários
├── interfaces/         # Tipos TypeScript
└── styles/             # Estilos e temas
```

## 🚀 Configuração e Instalação

### Pré-requisitos
- **Node.js** >= 20.0.0
- **npm** ou **pnpm**

### Instalação

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações

# Desenvolvimento
npm run dev        # Inicia servidor de desenvolvimento
npm run build      # Build para produção
npm run preview    # Preview do build
npm run lint       # Linting do código
```

## ⚙️ Configuração

### Variáveis de Ambiente (.env.local)

```env
# API Configuration
VITE_BASE_URL=http://localhost:7071/api
VITE_SENTRY_AUTH_TOKEN=seu-token-sentry-opcional

# Authentication
VITE_GOOGLE_CLIENT_ID=seu-google-client-id

# Analytics
VITE_GA_TOKEN=seu-google-analytics-token
```

## 🧩 Componentes Principais

### 🎨 Design System
Baseado em **Chakra UI** com customizações:

```typescript
// Tema personalizado
const theme = extendTheme({
  colors: {
    primary: {
      50: '#e3f2fd',
      500: '#2196f3',
      900: '#0d47a1',
    },
    secondary: {
      50: '#f3e5f5',
      500: '#9c27b0',
      900: '#4a148c',
    }
  },
  components: {
    Button: customButtonTheme,
    Input: customInputTheme,
    // ... outros componentes
  }
});
```

### 🔄 Gerenciamento de Estado
- **React Query** para estado servidor
- **Context API** para estado global
- **React Hook Form** para formulários
- **Zustand** para estado local complexo (quando necessário)

### 🖼️ Componentes Principais

#### Editor de Workflows
```typescript
import { ReactFlow, Node, Edge } from 'reactflow';
import { WorkflowEditor } from '@components/organisms/Workflow';

// Tipos de nós disponíveis
const nodeTypes = {
  conditional: ConditionalNode,
  action: ActionNode,
  email: EmailNode,
  webhook: WebhookNode,
  // ... outros tipos
};
```

#### Formulários Dinâmicos
```typescript
import { DynamicForm } from '@components/organisms/Forms';
import { useForm } from 'react-hook-form';

// Renderização baseada em schema
const FormRenderer = ({ schema, onSubmit }) => {
  const { control, handleSubmit } = useForm();
  
  return (
    <DynamicForm 
      schema={schema}
      control={control}
      onSubmit={handleSubmit(onSubmit)}
    />
  );
};
```

#### Tabelas Inteligentes
```typescript
import { DataTable } from '@components/organisms/Table';

// Tabela com filtros, paginação e ordenação
<DataTable
  data={activities}
  columns={activityColumns}
  pagination
  sorting
  filtering
  actions={tableActions}
/>
```

## 🎯 Páginas Principais

### 🏠 Dashboard
- **Visão Geral**: Metrics e KPIs principais
- **Atividades Recentes**: Timeline de ações
- **Workflows Ativos**: Status de execução
- **Notifications**: Alertas e lembretes

### 🔄 Workflows
- **Lista de Workflows**: Gerenciamento completo
- **Editor Visual**: Criação e edição
- **Histórico de Execuções**: Auditoria detalhada
- **Templates**: Workflows pré-configurados

### 📋 Atividades
- **Listagem Filtrable**: Busca avançada
- **Detalhes da Atividade**: Timeline completa
- **Formulários de Interação**: Coleta de dados
- **Anexos e Comentários**: Colaboração

### 👥 Usuários e Permissões
- **Gerenciamento de Usuários**: CRUD completo
- **Controle de Acesso**: Roles e permissions
- **Profile Management**: Configurações pessoais

## 🔌 Integração com APIs

### HTTP Client Configurado
```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  timeout: 10000,
});

// Interceptors para auth e error handling
api.interceptors.request.use(authInterceptor);
api.interceptors.response.use(successHandler, errorHandler);
```

### React Query Setup
```typescript
// hooks/queries/useActivities.ts
import { useQuery, useMutation } from '@tanstack/react-query';

export const useActivities = (filters?: ActivityFilters) => {
  return useQuery({
    queryKey: ['activities', filters],
    queryFn: () => activitiesAPI.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useCreateActivity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: activitiesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
    },
  });
};
```

## 🎨 Estilos e Temas

### Chakra UI Theme
```typescript
// styles/theme.ts
export const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
      },
    }),
  },
});
```

### Tailwind Integration
```typescript
// Utility classes para casos específicos
import { cn } from '@utils/cn';

const className = cn(
  'base-styles',
  condition && 'conditional-styles',
  'override-styles'
);
```

## 🧪 Testes

### Estrutura de Testes
```
src/
├── __tests__/
│   ├── components/     # Testes de componentes
│   ├── pages/          # Testes de páginas
│   ├── hooks/          # Testes de hooks
│   └── utils/          # Testes de utilitários
```

### Testing Library Setup
```typescript
// Componente de teste wrapper
const TestWrapper = ({ children }) => (
  <ChakraProvider theme={theme}>
    <QueryClient client={testQueryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClient>
  </ChakraProvider>
);
```

## 🚀 Build e Deploy

### Development
```bash
npm run dev
# Servidor em http://localhost:5173
```

### Production Build
```bash
npm run build
# Arquivos otimizados em /dist

npm run preview
# Preview local do build
```

### Environment Specific Builds
```typescript
// vite.config.ts
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      __API_URL__: JSON.stringify(env.VITE_BASE_URL),
    },
    build: {
      sourcemap: mode === 'development',
      minify: mode === 'production',
    },
  };
});
```

## 🔍 Debugging e Desenvolvimento

### DevTools Integrados
- **React DevTools**: Componentes e hooks
- **React Query DevTools**: Estado de queries
- **Redux DevTools**: Estado global (se usado)

### Error Boundaries
```typescript
// Tratamento global de erros
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

### Performance Monitoring
```typescript
// Lazy loading de componentes
const WorkflowEditor = lazy(() => import('@pages/Workflows/Editor'));

// Code splitting por rota
const router = createBrowserRouter([
  {
    path: '/workflows',
    lazy: () => import('@pages/Workflows'),
  },
]);
```

## 🌐 Internacionalização

### i18next Setup
```typescript
// i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: ptTranslations },
      en: { translation: enTranslations },
    },
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
  });
```

### Uso nos Componentes
```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t, i18n } = useTranslation();
  
  return (
    <Text>{t('welcome.message')}</Text>
  );
};
```

## 📱 PWA Features

### Service Worker
```typescript
// PWA capabilities
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### Offline Support
- **Cache strategies** para recursos críticos
- **Background sync** para ações offline
- **Push notifications** (planejado)

## 🤝 Contribuindo

### Guidelines de Desenvolvimento
1. **Componentes**: Siga o padrão Atomic Design
2. **Hooks**: Prefixe com `use` e documente
3. **Tipos**: Use TypeScript strict mode
4. **Testes**: Cobertura mínima de 80%
5. **Commits**: Siga Conventional Commits

### Code Standards
```bash
# Linting automático
npm run lint
npm run lint:fix

# Formatação automática
npm run format

# Type checking
npm run type-check
```

## 📊 Performance

### Bundle Analysis
```bash
# Analisar bundle size
npm run build:analyze
```

### Otimizações Implementadas
- **Code Splitting** por rotas
- **Lazy Loading** de componentes pesados
- **Image Optimization** automática
- **Tree Shaking** para bibliotecas
- **Memoization** estratégica de componentes

## 🆘 Troubleshooting

### Problemas Comuns

**Build fails com TypeScript:**
```bash
# Verificar tipos
npm run type-check

# Limpar cache se necessário
rm -rf node_modules/.cache
```

**HMR não funciona:**
```bash
# Verificar configuração Vite
# Reiniciar servidor de desenvolvimento
npm run dev
```

---

Para mais informações detalhadas, consulte a [documentação completa](../docs/frontend/README.md) ou abra uma [issue](https://github.com/your-org/streamline/issues).
