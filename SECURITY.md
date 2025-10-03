# 🛡️ Política de Segurança

## Versões Suportadas

Atualmente, oferecemos suporte de segurança para as seguintes versões:

| Versão | Suporte |
| ------- | ------- |
| 1.0.x   | ✅ |

## 🚨 Reportando Vulnerabilidades

A segurança do Streamline é uma prioridade. Se você descobrir uma vulnerabilidade de segurança, siga estas diretrizes:

### Para Vulnerabilidades de Segurança:

**NÃO** abra uma issue pública para vulnerabilidades de segurança.

Em vez disso:

1. **Email**: Envie um email para `security@streamline.dev`
2. **Assunto**: Use o formato: `[SECURITY] Descrição breve da vulnerabilidade`
3. **Conteúdo**: Inclua:
   - Descrição detalhada da vulnerabilidade
   - Passos para reproduzir
   - Versões afetadas
   - Impacto potencial
   - Sugestões de correção (se tiver)

### Processo de Resposta

1. **Confirmação**: Confirmaremos o recebimento em 24 horas
2. **Avaliação**: Avaliaremos a vulnerabilidade em 72 horas
3. **Correção**: Trabalharemos em uma correção com prazo baseado na severidade
4. **Divulgação**: Coordenaremos a divulgação responsável

### Níveis de Severidade

- **Crítica**: Correção em 1-7 dias
- **Alta**: Correção em 7-30 dias  
- **Média**: Correção em 30-90 dias
- **Baixa**: Próxima release planejada

## 🔒 Práticas de Segurança

### No Backend
- Autenticação JWT com tokens seguros
- Validação rigorosa de input
- Rate limiting implementado
- Hashing seguro de senhas (bcrypt)
- CORS configurado adequadamente

### No Frontend
- Sanitização de dados do usuário
- Proteção contra XSS
- Validação client-side e server-side
- Armazenamento seguro de tokens

### Na Infraestrutura
- HTTPS forçado em produção
- Secrets gerenciados via Azure Key Vault
- Rede configurada com security groups
- Logs de auditoria habilitados

## 🏆 Reconhecimentos

Reconhecemos e agradecemos aos pesquisadores de segurança que reportam vulnerabilidades responsavelmente. 

### Hall of Fame
*Lista será atualizada conforme recebemos reports válidos*

## 📞 Contato

Para questões de segurança:
- **Email**: security@streamline.dev
- **PGP Key**: [Link para chave pública] (em breve)

Para outras questões:
- **General**: team@streamline.dev
- **GitHub Issues**: Para bugs não relacionados à segurança