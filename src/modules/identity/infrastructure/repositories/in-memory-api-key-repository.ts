import type { ApiKeyRepository } from '../../application/repositories/api-key-repository';
import { ApiKey } from '../../domain/entities/api-key';
import type { Scope } from '../../domain/entities/scope';

export class InMemoryApiKeyRepository implements ApiKeyRepository {
  private apiKeys: Map<string, ApiKey> = new Map();
  private apiKeyScopes: Map<string, Set<string>> = new Map(); // apiKeyId -> Set<scopeId>
  private scopes: Map<string, Scope> = new Map(); // scopeId -> Scope

  async save(apiKey: ApiKey, name?: string): Promise<ApiKey> {
    this.apiKeys.set(apiKey.id, apiKey);

    // Sync scopes from entity to the scope maps
    const entityScopes = apiKey.getScopes();
    const scopeIds = new Set<string>();

    entityScopes.forEach((scope) => {
      // Find or create a scopeId for this scope
      let scopeId: string | undefined;
      for (const [id, existingScope] of this.scopes.entries()) {
        if (existingScope.equals(scope)) {
          scopeId = id;
          break;
        }
      }

      // If scope doesn't exist, create a new scopeId
      if (!scopeId) {
        scopeId = `scope-${scope.value.replace(/:/g, '-')}`;
        this.scopes.set(scopeId, scope);
      }

      scopeIds.add(scopeId);
    });

    this.apiKeyScopes.set(apiKey.id, scopeIds);

    return apiKey;
  }

  async findById(id: string): Promise<ApiKey | null> {
    const apiKey = this.apiKeys.get(id);
    if (!apiKey) {
      return null;
    }

    // Load scopes
    const scopeIds = this.apiKeyScopes.get(id) || new Set();
    const scopes = Array.from(scopeIds)
      .map((scopeId) => this.scopes.get(scopeId))
      .filter((scope): scope is Scope => scope !== undefined);

    // Create a copy with scopes
    const apiKeyWithScopes = new ApiKey(
      apiKey.id,
      apiKey.hash,
      apiKey.owner,
      apiKey.getStatus(),
      apiKey.getExpiresAt(),
      apiKey.getCreatedAt(),
      apiKey.getLastUsedAt()
    );

    scopes.forEach((scope) => apiKeyWithScopes.addScope(scope));

    return apiKeyWithScopes;
  }

  async findByHash(hash: string): Promise<ApiKey | null> {
    for (const apiKey of this.apiKeys.values()) {
      if (apiKey.hash === hash) {
        return this.findById(apiKey.id);
      }
    }
    return null;
  }

  async findByOwnerId(ownerId: string): Promise<ApiKey[]> {
    const result: ApiKey[] = [];
    for (const apiKey of this.apiKeys.values()) {
      if (apiKey.owner === ownerId) {
        const found = await this.findById(apiKey.id);
        if (found) {
          result.push(found);
        }
      }
    }
    return result;
  }

  async update(apiKey: ApiKey): Promise<ApiKey> {
    if (!this.apiKeys.has(apiKey.id)) {
      throw new Error(`API key ${apiKey.id} not found`);
    }

    this.apiKeys.set(apiKey.id, apiKey);

    // Sync scopes from entity to the scope maps
    const entityScopes = apiKey.getScopes();
    const scopeIds = this.apiKeyScopes.get(apiKey.id) || new Set();

    // Add new scopes that are in the entity but not in the map
    entityScopes.forEach((scope) => {
      // Find or create a scopeId for this scope
      let scopeId: string | undefined;
      for (const [id, existingScope] of this.scopes.entries()) {
        if (existingScope.equals(scope)) {
          scopeId = id;
          break;
        }
      }

      // If scope doesn't exist, create a new scopeId
      if (!scopeId) {
        scopeId = `scope-${scope.value.replace(/:/g, '-')}`;
        this.scopes.set(scopeId, scope);
      }

      scopeIds.add(scopeId);
    });

    this.apiKeyScopes.set(apiKey.id, scopeIds);

    return this.findById(apiKey.id) as Promise<ApiKey>;
  }

  async revoke(id: string): Promise<void> {
    const apiKey = this.apiKeys.get(id);
    if (apiKey) {
      apiKey.revoke();
      this.apiKeys.set(id, apiKey);
    }
  }

  async findScopesByApiKeyId(apiKeyId: string): Promise<Scope[]> {
    const scopeIds = this.apiKeyScopes.get(apiKeyId) || new Set();
    return Array.from(scopeIds)
      .map((scopeId) => this.scopes.get(scopeId))
      .filter((scope): scope is Scope => scope !== undefined);
  }

  async addScopeToApiKey(apiKeyId: string, scopeId: string): Promise<void> {
    if (!this.apiKeys.has(apiKeyId)) {
      throw new Error(`API key ${apiKeyId} not found`);
    }

    const scopeIds = this.apiKeyScopes.get(apiKeyId) || new Set();
    if (!scopeIds.has(scopeId)) {
      scopeIds.add(scopeId);
      this.apiKeyScopes.set(apiKeyId, scopeIds);
    }
  }

  async removeScopeFromApiKey(apiKeyId: string, scopeId: string): Promise<void> {
    const scopeIds = this.apiKeyScopes.get(apiKeyId);
    if (scopeIds) {
      scopeIds.delete(scopeId);
    }
  }

  // Helper methods for testing
  addScope(scopeId: string, scope: Scope): void {
    this.scopes.set(scopeId, scope);
  }

  clear(): void {
    this.apiKeys.clear();
    this.apiKeyScopes.clear();
    this.scopes.clear();
  }
}
