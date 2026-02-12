import { ApiKey } from '@/modules/identity/domain/entities/api-key';
import type { Scope } from '@/modules/identity/domain/entities/scope';
import type { apiKeys as ApiKeysSchema } from '../schemas';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

type ApiKeyQuery = InferSelectModel<typeof ApiKeysSchema>;
type ApiKeyInsertPersistence = InferInsertModel<typeof ApiKeysSchema>;

export class ApiKeyMapper {
  static toDomain(row: ApiKeyQuery, scopes: Scope[] = []): ApiKey {
    const apiKey = new ApiKey(
      row.id,
      row.keyHash,
      row.ownerId,
      row.status as 'active' | 'revoked',
      row.expiresAt,
      row.createdAt,
      row.lastUsedAt
    );

    // Add scopes to the API key
    scopes.forEach((scope) => apiKey.addScope(scope));

    return apiKey;
  }

  static toInsert(
    apiKey: ApiKey,
    name?: string
  ): Omit<ApiKeyInsertPersistence, 'id' | 'createdAt'> {
    return {
      name: name || `API Key ${new Date().toISOString()}`,
      keyHash: apiKey.hash,
      ownerId: apiKey.owner,
      status: apiKey.getStatus(),
      expiresAt: apiKey.getExpiresAt(),
      lastUsedAt: apiKey.getLastUsedAt(),
    };
  }

  static toUpdate(apiKey: ApiKey): Partial<ApiKeyInsertPersistence> {
    return {
      keyHash: apiKey.hash,
      ownerId: apiKey.owner,
      status: apiKey.getStatus(),
      expiresAt: apiKey.getExpiresAt(),
      lastUsedAt: apiKey.getLastUsedAt(),
    };
  }
}
