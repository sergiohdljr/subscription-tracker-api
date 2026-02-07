# API Key Authentication Strategy

Esta estratégia implementa autenticação via API Key no módulo auth.

## Estrutura

```
api-key/
├── api-key.context.ts    # Define o contexto da API key autenticada
├── api-key.guard.ts      # Guard/middleware para validar API keys
├── scope-guard.ts        # Helpers para verificar scopes
└── README.md            # Esta documentação
```

## Componentes

### `api-key.context.ts`

Define o tipo `ApiKeyContext` que contém:
- `apiKey`: A entidade ApiKey autenticada
- `ownerId`: ID do proprietário da API key
- `scopes`: Lista de scopes da API key

### `api-key.guard.ts`

Middleware que:
1. Extrai a API key do header (`Authorization: Bearer <key>` ou `X-API-Key`)
2. Faz hash da chave usando `ApiKeyHash`
3. Busca no repositório
4. Valida se está ativa e não expirada
5. Marca como usada (`lastUsedAt`)
6. Adiciona o contexto ao `request.apiKey`

### `scope-guard.ts`

Helpers para verificar permissões:
- `requireScope(scope)`: Requer um scope específico
- `requireAnyScope(...scopes)`: Requer pelo menos um dos scopes
- `requireAllScopes(...scopes)`: Requer todos os scopes

## Uso

### 1. Usar apenas API Key Guard

```typescript
import { createApiKeyGuard } from '@/modules/auth/infrastructure/http/strategies/api-key/api-key.guard'
import { ApiKeyDrizzleRepository } from '@/modules/identity/infrastructure/repositories/api-key-drizzle-repository'
import { db } from '@/shared/infrastructure/db/drizzle/connection-pool'

const apiKeyRepository = new ApiKeyDrizzleRepository(db)
const apiKeyGuard = createApiKeyGuard(apiKeyRepository)

// Em uma rota
app.get('/api/protected', apiKeyGuard, async (request, reply) => {
  // request.apiKey está disponível aqui
  const ownerId = request.apiKey!.ownerId
  const scopes = request.apiKey!.scopes
  
  return { message: 'Authenticated with API key', ownerId, scopes }
})
```

### 2. Usar com verificação de scope

```typescript
import { requireScope } from '@/modules/auth/infrastructure/http/strategies/api-key/scope-guard'

app.post(
  '/api/subscriptions',
  apiKeyGuard,
  requireScope('subscriptions:write'),
  async (request, reply) => {
    // Só chega aqui se tiver o scope 'subscriptions:write'
    // ...
  }
)
```

### 3. Usar autenticação combinada (API Key ou Session)

```typescript
import { createCombinedAuthMiddleware } from '@/modules/auth/infrastructure/http/middlewares/combined-auth-middleware'

const combinedAuth = createCombinedAuthMiddleware(apiKeyRepository)

// No index.ts, substituir betterAuthMiddleware por combinedAuth
server.addHook('onRequest', combinedAuth)

// Nas rotas, você pode acessar:
// - request.user (se autenticado via session)
// - request.apiKey (se autenticado via API key)
```

## Headers Suportados

A API key deve ser enviada via:

**X-API-Key Header**:
```
X-API-Key: api.key_prd_abc123...
```

## Respostas de Erro

- **401 Unauthorized**: API key não fornecida, inválida, revogada ou expirada
- **403 Forbidden**: API key válida mas sem o scope necessário

## Exemplo Completo

```typescript
import { FastifyInstance } from 'fastify'
import { createApiKeyGuard } from '@/modules/auth/infrastructure/http/strategies/api-key/api-key.guard'
import { requireScope } from '@/modules/auth/infrastructure/http/strategies/api-key/scope-guard'
import { ApiKeyDrizzleRepository } from '@/modules/identity/infrastructure/repositories/api-key-drizzle-repository'
import { db } from '@/shared/infrastructure/db/drizzle/connection-pool'

export async function protectedRoutes(app: FastifyInstance) {
  const apiKeyRepository = new ApiKeyDrizzleRepository(db)
  const apiKeyGuard = createApiKeyGuard(apiKeyRepository)

  // Rota protegida por API key
  app.get('/api/data', apiKeyGuard, async (request, reply) => {
    return {
      ownerId: request.apiKey!.ownerId,
      scopes: request.apiKey!.scopes
    }
  })

  // Rota protegida por API key com scope específico
  app.post(
    '/api/subscriptions',
    apiKeyGuard,
    requireScope('subscriptions:write'),
    async (request, reply) => {
      // Implementação...
    }
  )
}
```

