# Configuração de Logs

Este documento descreve a estratégia de logging da aplicação usando Pino.

## Níveis de Log

A aplicação suporta os seguintes níveis de log (em ordem crescente de severidade):

- **trace**: Logs muito detalhados, raramente usado
- **debug**: Informações detalhadas para desenvolvimento e debugging
- **info**: Informações gerais sobre o funcionamento da aplicação
- **warn**: Avisos sobre situações que podem precisar de atenção
- **error**: Erros que não impedem a execução
- **fatal**: Erros críticos que podem causar falha na aplicação

## Configuração por Ambiente

### Desenvolvimento

Em desenvolvimento, o foco é na **alta visibilidade** para facilitar o debugging:

- **Nível padrão**: `debug`
- **Pretty print**: Habilitado (logs formatados e coloridos)
- **Recomendação**: Use `debug` ou `trace` para investigar problemas específicos

```env
NODE_ENV=development
LOG_LEVEL=debug
```

### Produção

Em produção, o foco é na **estabilidade e custo**:

- **Nível padrão**: `info`
- **Pretty print**: Desabilitado (logs em JSON para parsing)
- **warn, error e fatal**: Sempre habilitados (independente do nível configurado)
- **debug**: Use apenas temporariamente durante investigação de problemas
- **trace**: Desativado em produção

```env
NODE_ENV=production
LOG_LEVEL=info
```

## Variável de Ambiente LOG_LEVEL

Você pode sobrescrever o nível padrão usando a variável de ambiente `LOG_LEVEL`:

```env
LOG_LEVEL=debug
```

**Níveis válidos**: `trace`, `debug`, `info`, `warn`, `error`, `fatal`

Se um nível inválido for fornecido, o sistema usará o padrão baseado no ambiente e exibirá um aviso.

## Exemplos de Uso

### Desenvolvimento com debug detalhado

```env
NODE_ENV=development
LOG_LEVEL=trace
```

### Produção com logs mínimos

```env
NODE_ENV=production
LOG_LEVEL=info
```

### Investigação temporária em produção

```env
NODE_ENV=production
LOG_LEVEL=debug
```

⚠️ **Importante**: Após investigar, retorne para `info` para evitar custos desnecessários.

## Boas Práticas

1. **Em desenvolvimento**: Use `debug` ou `trace` para entender o comportamento interno
2. **Em produção**: Mantenha em `info` como padrão
3. **Durante investigação**: Aumente temporariamente para `debug`
4. **Logs estruturados**: Use objetos para contexto adicional:
   ```typescript
   logger.info({ userId, requestId }, 'User action completed');
   ```
5. **Evite logs verbosos em produção**: Logs muito detalhados aumentam consumo de CPU, disco e serviços de monitoramento

## Hierarquia de Níveis

Quando você configura um nível, todos os níveis acima dele também são habilitados:

- `trace`: Todos os logs
- `debug`: debug, info, warn, error, fatal
- `info`: info, warn, error, fatal
- `warn`: warn, error, fatal
- `error`: error, fatal
- `fatal`: Apenas fatal

