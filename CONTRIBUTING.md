# 🤝 Guia de Contribuição

Obrigado pelo interesse em contribuir com o **Streamline**! Este guia contém todas as informações necessárias para colaborar efetivamente com o projeto.

## 📋 Código de Conduta

Ao participar deste projeto, você concorda em seguir nosso [Código de Conduta](CODE_OF_CONDUCT.md). Esperamos que todos os colaboradores:

- **Sejam respeitosos** e inclusivos
- **Colaborem construtivamente** 
- **Mantenham discussões técnicas** focadas e produtivas
- **Respeitem diferentes perspectivas** e experiências

## 🚀 Como Começar

### 1. Configuração do Ambiente

```bash
# 1. Fork o repositório no GitHub
# 2. Clone seu fork
git clone https://github.com/SEU-USERNAME/streamline.git
cd streamline

# 3. Adicione o repositório original como upstream
git remote add upstream https://github.com/tech4humans-brasil/streamline.git

# 4. Configure o ambiente de desenvolvimento
# Backend
cd Backend
npm install
cp local.example.setting.json local.settings.json
# Configure suas variáveis de ambiente

# Frontend  
cd ../Frontend
npm install
cp .env.example .env.local
# Configure suas variáveis de ambiente
```

### 2. Executando Localmente

```bash
# Terminal 1 - Backend
cd Backend
npm run dev

# Terminal 2 - Frontend
cd Frontend
npm run dev
```

## 🎯 Tipos de Contribuição

### 🐛 Reportando Bugs

Antes de reportar um bug:
1. **Pesquise** nas [issues existentes](https://github.com/tech4humans-brasil/streamline/issues)
2. **Verifique** se está usando a versão mais recente
3. **Reproduza** o problema consistentemente

**Template para Bug Report:**
```markdown
## 🐛 Descrição do Bug
[Descrição clara e concisa do problema]

## 🔄 Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

## ✅ Comportamento Esperado
[O que deveria acontecer]

## 📱 Ambiente
- **OS**: [Windows/macOS/Linux]
- **Browser**: [Chrome, Firefox, Safari]
- **Versão**: [v1.0.0]
- **Node.js**: [v20.x.x]

## 📎 Screenshots/Logs
[Adicione capturas de tela ou logs se relevante]
```

### 💡 Sugerindo Funcionalidades

**Template para Feature Request:**
```markdown
## 🚀 Feature Request

### 📝 Resumo
[Descrição breve da funcionalidade]

### 🎯 Motivação
[Por que esta funcionalidade é necessária?]

### 💭 Solução Proposta
[Como você imagina que funcione?]

### 🔄 Alternativas Consideradas
[Outras abordagens que você pensou]

### 📊 Impacto Esperado
[Como isso beneficiaria os usuários?]
```

### 🔧 Contribuindo com Código

#### 1. Escolhendo uma Issue
- Procure issues marcadas com `good first issue` para começar
- Issues com `help wanted` são prioridade
- Comente na issue que deseja trabalhar para evitar duplicação

#### 2. Workflow de Desenvolvimento

```bash
# 1. Sincronize com upstream
git checkout main
git pull upstream main

# 2. Crie uma branch para sua feature
git checkout -b feature/nome-da-feature
# ou
git checkout -b fix/nome-do-bug

# 3. Faça suas alterações
# ... desenvolvimento ...

# 4. Commit seguindo padrões
git add .
git commit -m "feat: adiciona nova funcionalidade X"

# 5. Push para seu fork
git push origin feature/nome-da-feature

# 6. Abra um Pull Request
```

#### 3. Padrões de Commit

Seguimos o [Conventional Commits](https://conventionalcommits.org/):

```bash
# Tipos de commit
feat:     # Nova funcionalidade
fix:      # Correção de bug
docs:     # Documentação
style:    # Formatação (não afeta lógica)
refactor: # Refatoração de código
test:     # Adição/correção de testes
chore:    # Tarefas de manutenção

# Exemplos
git commit -m "feat: adiciona autenticação OAuth"
git commit -m "fix: corrige bug na validação de formulários"
git commit -m "docs: atualiza README com novos endpoints"
```

#### 4. Padrões de Código

**Backend (TypeScript):**
```typescript
// ✅ Bom
export interface UserCreateRequest {
  name: string;
  email: string;
  role: UserRole;
}

export class UserService {
  async createUser(data: UserCreateRequest): Promise<User> {
    // Implementação
  }
}

// ❌ Evitar
export function createUser(name, email, role) {
  // Sem tipos
}
```

**Frontend (React + TypeScript):**
```typescript
// ✅ Bom
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant, 
  onClick, 
  children 
}) => {
  return (
    <ChakraButton 
      variant={variant}
      onClick={onClick}
    >
      {children}
    </ChakraButton>
  );
};

// ❌ Evitar
export const Button = (props) => {
  return <button>{props.children}</button>;
};
```

## 🧪 Testes

### Executando Testes

```bash
# Backend
cd Backend
npm test
npm run test:watch
npm run test:coverage

# Frontend
cd Frontend
npm test
npm run test:watch
npm run test:coverage
```

### Escrevendo Testes

**Backend (Jest):**
```typescript
// UserService.test.ts
describe('UserService', () => {
  it('should create user successfully', async () => {
    // Arrange
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.USER
    };

    // Act
    const result = await userService.createUser(userData);

    // Assert
    expect(result).toBeDefined();
    expect(result.email).toBe(userData.email);
  });
});
```

**Frontend (Testing Library):**
```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should call onClick when clicked', () => {
    // Arrange
    const mockClick = jest.fn();
    render(<Button onClick={mockClick}>Click me</Button>);

    // Act
    fireEvent.click(screen.getByText('Click me'));

    // Assert
    expect(mockClick).toHaveBeenCalledTimes(1);
  });
});
```

## 📝 Documentação

### Contribuindo com Docs

```bash
# Estrutura da documentação
docs/
├── guides/          # Guias de uso
├── api/            # Referência da API
├── architecture/   # Documentação técnica
└── development/    # Guias de desenvolvimento
```

### Padrões de Documentação

```markdown
# Título Principal

Breve descrição do que será coberto.

## Seção Principal

### Subseção

- Use **negrito** para termos importantes
- Use `código` para referências técnicas
- Use > blockquotes para observações importantes

```bash
# Exemplos de código sempre com syntax highlighting
npm install exemplo
```

> 💡 **Dica**: Adicione dicas úteis quando relevante
```

## 🔍 Code Review

### O que Esperamos

**Para Reviewers:**
- **Feedback construtivo** e específico
- **Sugestões de melhoria** quando possível
- **Aprovação rápida** para mudanças simples
- **Teste** das mudanças quando necessário

**Para Contributors:**
- **Resposta às mudanças** solicitadas
- **Discussão** sobre feedback quando necessário
- **Paciência** durante o processo de review

### Checklist de PR

Antes de enviar seu PR, verifique:

- [ ] **Testes** passando
- [ ] **Linting** sem erros
- [ ] **TypeScript** sem erros de tipo
- [ ] **Documentação** atualizada se necessário
- [ ] **Commits** seguem padrão convencional
- [ ] **Descrição** clara do PR
- [ ] **Issues** relacionadas linkadas

## 🏷️ Labels e Issues

### Labels Principais

- `bug` - Algo não está funcionando
- `enhancement` - Nova funcionalidade ou melhoria
- `documentation` - Melhorias na documentação
- `good first issue` - Bom para iniciantes
- `help wanted` - Precisamos de ajuda da comunidade
- `priority: high` - Alta prioridade
- `priority: low` - Baixa prioridade
- `area: backend` - Relacionado ao backend
- `area: frontend` - Relacionado ao frontend
- `area: docs` - Relacionado à documentação

## 🚀 Release Process

### Versionamento

Seguimos [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0): Mudanças incompatíveis
- **MINOR** (0.1.0): Novas funcionalidades compatíveis
- **PATCH** (0.0.1): Correções de bugs

### Changelog

Mantemos um [CHANGELOG.md](CHANGELOG.md) atualizado com:
- **Added**: Novas funcionalidades
- **Changed**: Mudanças em funcionalidades existentes
- **Deprecated**: Funcionalidades que serão removidas
- **Removed**: Funcionalidades removidas
- **Fixed**: Correções de bugs
- **Security**: Correções de segurança

## 🆘 Suporte

### Onde Buscar Ajuda

1. **Documentação**: Verifique a documentação existente
2. **Issues**: Pesquise issues similares
3. **Discussions**: Use GitHub Discussions para perguntas
4. **Discord**: Junte-se ao nosso servidor Discord
5. **Email**: team@streamline.dev para questões mais complexas

### Reportando Problemas de Segurança

Para questões de segurança, **NÃO** use issues públicas. 
Envie um email para: security@streamline.dev

## 🎉 Reconhecimento

Todos os colaboradores são reconhecidos:
- **Contributors**: Listados no README
- **Hall of Fame**: Colaboradores destacados
- **Swag**: Brindes para contribuições significativas

### Tipos de Contribuição Reconhecidas

- 💻 **Code**: Contribuições de código
- 📖 **Documentation**: Documentação
- 🐛 **Bug Reports**: Relatórios de bugs
- 💡 **Ideas**: Ideias e sugestões
- 🤔 **Mentoring**: Mentoria de novos colaboradores
- 📢 **Outreach**: Divulgação do projeto

## 📊 Métricas e Analytics

Monitoramos:
- **Tempo de resposta** a issues e PRs
- **Taxa de aprovação** de PRs
- **Cobertura de testes**
- **Satisfação** da comunidade

## 🔄 Processo de Manutenção

### Responsabilidades dos Maintainers

- **Triagem** de issues e PRs
- **Code review** em tempo hábil
- **Releases** regulares
- **Comunicação** com a comunidade
- **Mentoria** de novos colaboradores

---

## 🙏 Agradecimentos

Obrigado por contribuir com o Streamline! Sua participação torna este projeto melhor para toda a comunidade.

Para dúvidas sobre este guia, abra uma [issue](https://github.com/tech4h/streamline/issues) ou entre em contato conosco.
