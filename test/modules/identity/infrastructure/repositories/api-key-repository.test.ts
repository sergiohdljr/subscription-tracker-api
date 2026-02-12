import { InMemoryApiKeyRepository } from '@/modules/identity/infrastructure/repositories/in-memory-api-key-repository';
import { ApiKey } from '@/modules/identity/domain/entities/api-key';
import { Scope } from '@/modules/identity/domain/entities/scope';
import { ApiKeyHash } from '@/modules/identity/domain/value-objects/api-key-hash';

function makeApiKey(params: {
  id?: string;
  hash?: string;
  owner?: string;
  status?: 'active' | 'revoked';
  expiresAt?: Date | null;
  createdAt?: Date;
  lastUsedAt?: Date | null;
}): ApiKey {
  const now = new Date('2024-01-01T00:00:00.000Z');
  return new ApiKey(
    params.id ?? 'api-key-1',
    params.hash ?? 'hash-123',
    params.owner ?? 'user-1',
    params.status ?? 'active',
    params.expiresAt ?? null,
    params.createdAt ?? now,
    params.lastUsedAt ?? null
  );
}

function makeScope(value: string): Scope {
  return new Scope(value);
}

describe('InMemoryApiKeyRepository', () => {
  let repository: InMemoryApiKeyRepository;

  beforeEach(() => {
    repository = new InMemoryApiKeyRepository();
  });

  describe('save', () => {
    it('should save an API key', async () => {
      const apiKey = makeApiKey({ id: 'key-1' });

      const saved = await repository.save(apiKey);

      expect(saved.id).toBe('key-1');
      expect(saved.hash).toBe('hash-123');
      expect(saved.owner).toBe('user-1');
    });

    it('should save API key with name parameter', async () => {
      const apiKey = makeApiKey({ id: 'key-1' });

      const saved = await repository.save(apiKey, 'My API Key');

      expect(saved.id).toBe('key-1');
    });

    it('should allow saving multiple API keys', async () => {
      const apiKey1 = makeApiKey({ id: 'key-1', hash: 'hash-1' });
      const apiKey2 = makeApiKey({ id: 'key-2', hash: 'hash-2' });

      await repository.save(apiKey1);
      await repository.save(apiKey2);

      const found1 = await repository.findById('key-1');
      const found2 = await repository.findById('key-2');

      expect(found1).not.toBeNull();
      expect(found2).not.toBeNull();
      expect(found1?.id).toBe('key-1');
      expect(found2?.id).toBe('key-2');
    });
  });

  describe('findById', () => {
    it('should return null when API key does not exist', async () => {
      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should return API key when it exists', async () => {
      const apiKey = makeApiKey({ id: 'key-1' });
      await repository.save(apiKey);

      const found = await repository.findById('key-1');

      expect(found).not.toBeNull();
      expect(found?.id).toBe('key-1');
      expect(found?.hash).toBe('hash-123');
      expect(found?.owner).toBe('user-1');
    });

    it('should return API key with scopes when scopes are added', async () => {
      const apiKey = makeApiKey({ id: 'key-1' });
      await repository.save(apiKey);

      const scope = makeScope('subscriptions:read');
      repository.addScope('scope-1', scope);
      await repository.addScopeToApiKey('key-1', 'scope-1');

      const found = await repository.findById('key-1');

      expect(found).not.toBeNull();
      expect(found?.getScopes()).toHaveLength(1);
      expect(found?.hasScope(scope)).toBe(true);
    });
  });

  describe('findByHash', () => {
    it('should return null when hash does not exist', async () => {
      const result = await repository.findByHash('non-existent-hash');

      expect(result).toBeNull();
    });

    it('should return API key when hash exists', async () => {
      const apiKey = makeApiKey({ id: 'key-1', hash: 'specific-hash' });
      await repository.save(apiKey);

      const found = await repository.findByHash('specific-hash');

      expect(found).not.toBeNull();
      expect(found?.id).toBe('key-1');
      expect(found?.hash).toBe('specific-hash');
    });

    it('should return API key with scopes when found by hash', async () => {
      const apiKey = makeApiKey({ id: 'key-1', hash: 'hash-1' });
      await repository.save(apiKey);

      const scope = makeScope('subscriptions:write');
      repository.addScope('scope-1', scope);
      await repository.addScopeToApiKey('key-1', 'scope-1');

      const found = await repository.findByHash('hash-1');

      expect(found).not.toBeNull();
      expect(found?.getScopes()).toHaveLength(1);
    });
  });

  describe('findByOwnerId', () => {
    it('should return empty array when owner has no API keys', async () => {
      const result = await repository.findByOwnerId('user-without-keys');

      expect(result).toEqual([]);
    });

    it('should return all API keys for an owner', async () => {
      const apiKey1 = makeApiKey({ id: 'key-1', owner: 'user-1', hash: 'hash-1' });
      const apiKey2 = makeApiKey({ id: 'key-2', owner: 'user-1', hash: 'hash-2' });
      const apiKey3 = makeApiKey({ id: 'key-3', owner: 'user-2', hash: 'hash-3' });

      await repository.save(apiKey1);
      await repository.save(apiKey2);
      await repository.save(apiKey3);

      const result = await repository.findByOwnerId('user-1');

      expect(result).toHaveLength(2);
      expect(result.map((k) => k.id)).toContain('key-1');
      expect(result.map((k) => k.id)).toContain('key-2');
      expect(result.map((k) => k.id)).not.toContain('key-3');
    });

    it('should return API keys with their scopes', async () => {
      const apiKey = makeApiKey({ id: 'key-1', owner: 'user-1' });
      await repository.save(apiKey);

      const scope = makeScope('cron:execute');
      repository.addScope('scope-1', scope);
      await repository.addScopeToApiKey('key-1', 'scope-1');

      const result = await repository.findByOwnerId('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].getScopes()).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update an existing API key', async () => {
      const apiKey = makeApiKey({ id: 'key-1', hash: 'hash-1' });
      await repository.save(apiKey);

      const updatedApiKey = makeApiKey({
        id: 'key-1',
        hash: 'hash-updated',
        lastUsedAt: new Date('2024-01-02T00:00:00.000Z'),
      });

      const result = await repository.update(updatedApiKey);

      expect(result.hash).toBe('hash-updated');
      expect(result.getLastUsedAt()).toEqual(new Date('2024-01-02T00:00:00.000Z'));
    });

    it('should throw error when updating non-existent API key', async () => {
      const apiKey = makeApiKey({ id: 'non-existent' });

      await expect(repository.update(apiKey)).rejects.toThrow('API key non-existent not found');
    });

    it('should preserve scopes after update', async () => {
      const apiKey = makeApiKey({ id: 'key-1' });
      await repository.save(apiKey);

      const scope = makeScope('subscriptions:read');
      repository.addScope('scope-1', scope);
      await repository.addScopeToApiKey('key-1', 'scope-1');

      const updatedApiKey = makeApiKey({ id: 'key-1', hash: 'hash-updated' });
      const result = await repository.update(updatedApiKey);

      expect(result.hash).toBe('hash-updated');
      expect(result.getScopes()).toHaveLength(1);
    });
  });

  describe('revoke', () => {
    it('should revoke an API key', async () => {
      const apiKey = makeApiKey({ id: 'key-1' });
      await repository.save(apiKey);

      await repository.revoke('key-1');

      const found = await repository.findById('key-1');
      expect(found).not.toBeNull();
      expect(found?.getStatus()).toBe('revoked');
      expect(found?.isActive()).toBe(false);
    });

    it('should not throw error when revoking non-existent API key', async () => {
      await expect(repository.revoke('non-existent')).resolves.not.toThrow();
    });
  });

  describe('findScopesByApiKeyId', () => {
    it('should return empty array when API key has no scopes', async () => {
      const apiKey = makeApiKey({ id: 'key-1' });
      await repository.save(apiKey);

      const scopes = await repository.findScopesByApiKeyId('key-1');

      expect(scopes).toEqual([]);
    });

    it('should return all scopes for an API key', async () => {
      const apiKey = makeApiKey({ id: 'key-1' });
      await repository.save(apiKey);

      const scope1 = makeScope('subscriptions:read');
      const scope2 = makeScope('subscriptions:write');

      repository.addScope('scope-1', scope1);
      repository.addScope('scope-2', scope2);

      await repository.addScopeToApiKey('key-1', 'scope-1');
      await repository.addScopeToApiKey('key-1', 'scope-2');

      const scopes = await repository.findScopesByApiKeyId('key-1');

      expect(scopes).toHaveLength(2);
      expect(scopes.some((s) => s.value === 'subscriptions:read')).toBe(true);
      expect(scopes.some((s) => s.value === 'subscriptions:write')).toBe(true);
    });
  });

  describe('addScopeToApiKey', () => {
    it('should add a scope to an API key', async () => {
      const apiKey = makeApiKey({ id: 'key-1' });
      await repository.save(apiKey);

      const scope = makeScope('subscriptions:read');
      repository.addScope('scope-1', scope);

      await repository.addScopeToApiKey('key-1', 'scope-1');

      const found = await repository.findById('key-1');
      expect(found?.getScopes()).toHaveLength(1);
      expect(found?.hasScope(scope)).toBe(true);
    });

    it('should not add duplicate scopes', async () => {
      const apiKey = makeApiKey({ id: 'key-1' });
      await repository.save(apiKey);

      const scope = makeScope('subscriptions:read');
      repository.addScope('scope-1', scope);

      await repository.addScopeToApiKey('key-1', 'scope-1');
      await repository.addScopeToApiKey('key-1', 'scope-1');

      const found = await repository.findById('key-1');
      expect(found?.getScopes()).toHaveLength(1);
    });

    it('should throw error when adding scope to non-existent API key', async () => {
      await expect(repository.addScopeToApiKey('non-existent', 'scope-1')).rejects.toThrow(
        'API key non-existent not found'
      );
    });
  });

  describe('removeScopeFromApiKey', () => {
    it('should remove a scope from an API key', async () => {
      const apiKey = makeApiKey({ id: 'key-1' });
      await repository.save(apiKey);

      const scope1 = makeScope('subscriptions:read');
      const scope2 = makeScope('subscriptions:write');

      repository.addScope('scope-1', scope1);
      repository.addScope('scope-2', scope2);

      await repository.addScopeToApiKey('key-1', 'scope-1');
      await repository.addScopeToApiKey('key-1', 'scope-2');

      await repository.removeScopeFromApiKey('key-1', 'scope-1');

      const found = await repository.findById('key-1');
      expect(found?.getScopes()).toHaveLength(1);
      expect(found?.hasScope(scope2)).toBe(true);
      expect(found?.hasScope(scope1)).toBe(false);
    });

    it('should not throw error when removing scope from non-existent API key', async () => {
      await expect(
        repository.removeScopeFromApiKey('non-existent', 'scope-1')
      ).resolves.not.toThrow();
    });

    it('should not throw error when removing non-existent scope', async () => {
      const apiKey = makeApiKey({ id: 'key-1' });
      await repository.save(apiKey);

      await expect(
        repository.removeScopeFromApiKey('key-1', 'non-existent-scope')
      ).resolves.not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete API key lifecycle', async () => {
      // Create
      const apiKey = makeApiKey({ id: 'key-1', owner: 'user-1' });
      const saved = await repository.save(apiKey);
      expect(saved.id).toBe('key-1');

      // Add scopes
      const scope1 = makeScope('subscriptions:read');
      const scope2 = makeScope('subscriptions:write');
      repository.addScope('scope-1', scope1);
      repository.addScope('scope-2', scope2);
      await repository.addScopeToApiKey('key-1', 'scope-1');
      await repository.addScopeToApiKey('key-1', 'scope-2');

      // Find by hash
      const foundByHash = await repository.findByHash('hash-123');
      expect(foundByHash).not.toBeNull();
      expect(foundByHash?.getScopes()).toHaveLength(2);

      // Update last used
      const updated = makeApiKey({
        id: 'key-1',
        lastUsedAt: new Date('2024-01-02T00:00:00.000Z'),
      });
      await repository.update(updated);

      // Find by owner
      const ownerKeys = await repository.findByOwnerId('user-1');
      expect(ownerKeys).toHaveLength(1);
      expect(ownerKeys[0].getLastUsedAt()).toEqual(new Date('2024-01-02T00:00:00.000Z'));

      // Revoke
      await repository.revoke('key-1');
      const revoked = await repository.findById('key-1');
      expect(revoked?.getStatus()).toBe('revoked');
    });

    it('should handle multiple API keys with different scopes', async () => {
      const apiKey1 = makeApiKey({ id: 'key-1', owner: 'user-1', hash: 'hash-1' });
      const apiKey2 = makeApiKey({ id: 'key-2', owner: 'user-1', hash: 'hash-2' });

      await repository.save(apiKey1);
      await repository.save(apiKey2);

      const scope1 = makeScope('subscriptions:read');
      const scope2 = makeScope('cron:execute');

      repository.addScope('scope-1', scope1);
      repository.addScope('scope-2', scope2);

      await repository.addScopeToApiKey('key-1', 'scope-1');
      await repository.addScopeToApiKey('key-2', 'scope-2');

      const found1 = await repository.findById('key-1');
      const found2 = await repository.findById('key-2');

      expect(found1?.getScopes()).toHaveLength(1);
      expect(found1?.hasScope(scope1)).toBe(true);
      expect(found2?.getScopes()).toHaveLength(1);
      expect(found2?.hasScope(scope2)).toBe(true);
    });
  });
});
