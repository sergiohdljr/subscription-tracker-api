import { AssignScopeUseCase } from '@/modules/identity/application/use-cases/assign-scope-usecase';
import { InMemoryApiKeyRepository } from '@/modules/identity/infrastructure/repositories/in-memory-api-key-repository';
import { ApiKey } from '@/modules/identity/domain/entities/api-key';
import { Scope } from '@/modules/identity/domain/entities/scope';
import { ApiKeyNotFoundError } from '@/modules/identity/domain/errors/api-key-not-found.error';

function makeApiKey(params: {
  id?: string;
  hash?: string;
  owner?: string;
  status?: 'active' | 'revoked';
  scopes?: Scope[];
}): ApiKey {
  const now = new Date('2024-01-01T00:00:00.000Z');
  const apiKey = new ApiKey(
    params.id ?? 'api-key-1',
    params.hash ?? 'hash-123',
    params.owner ?? 'user-1',
    params.status ?? 'active',
    null,
    now,
    null
  );

  if (params.scopes) {
    params.scopes.forEach((scope) => apiKey.addScope(scope));
  }

  return apiKey;
}

describe('AssignScopeUseCase', () => {
  let useCase: AssignScopeUseCase;
  let repository: InMemoryApiKeyRepository;

  beforeEach(() => {
    repository = new InMemoryApiKeyRepository();
    useCase = new AssignScopeUseCase(repository);
  });

  it('should assign a scope to an API key', async () => {
    const apiKey = makeApiKey({ id: 'key-1' });
    await repository.save(apiKey);

    const result = await useCase.execute({
      apiKeyId: 'key-1',
      scopeValue: 'subscriptions:read',
    });

    expect(result.apiKeyId).toBe('key-1');
    expect(result.scope).toBe('subscriptions:read');

    const updated = await repository.findById('key-1');
    const scopes = updated?.getScopes() || [];
    expect(scopes).toHaveLength(1);
    expect(scopes[0].value).toBe('subscriptions:read');
  });

  it('should assign multiple scopes to an API key', async () => {
    const apiKey = makeApiKey({ id: 'key-1' });
    await repository.save(apiKey);

    await useCase.execute({
      apiKeyId: 'key-1',
      scopeValue: 'subscriptions:read',
    });

    await useCase.execute({
      apiKeyId: 'key-1',
      scopeValue: 'subscriptions:write',
    });

    const updated = await repository.findById('key-1');
    const scopes = updated?.getScopes() || [];
    expect(scopes).toHaveLength(2);
    expect(scopes.map((s) => s.value)).toContain('subscriptions:read');
    expect(scopes.map((s) => s.value)).toContain('subscriptions:write');
  });

  it('should not duplicate scopes if scope already exists', async () => {
    const scope = new Scope('subscriptions:read');
    const apiKey = makeApiKey({ id: 'key-1', scopes: [scope] });
    await repository.save(apiKey);
    await repository.update(apiKey); // Sync scopes

    const result = await useCase.execute({
      apiKeyId: 'key-1',
      scopeValue: 'subscriptions:read',
    });

    expect(result.scope).toBe('subscriptions:read');

    const updated = await repository.findById('key-1');
    const scopes = updated?.getScopes() || [];
    expect(scopes).toHaveLength(1);
    expect(scopes[0].value).toBe('subscriptions:read');
  });

  it('should throw error if API key does not exist', async () => {
    await expect(
      useCase.execute({
        apiKeyId: 'non-existent',
        scopeValue: 'subscriptions:read',
      })
    ).rejects.toThrow(ApiKeyNotFoundError);
  });

  it('should validate scope format', async () => {
    const apiKey = makeApiKey({ id: 'key-1' });
    await repository.save(apiKey);

    await expect(
      useCase.execute({
        apiKeyId: 'key-1',
        scopeValue: 'invalid-scope', // Missing ':'
      })
    ).rejects.toThrow('Invalid scope format');
  });

  it('should work with different scope formats', async () => {
    const apiKey = makeApiKey({ id: 'key-1' });
    await repository.save(apiKey);

    await useCase.execute({
      apiKeyId: 'key-1',
      scopeValue: 'subscriptions:read',
    });

    await useCase.execute({
      apiKeyId: 'key-1',
      scopeValue: 'users:write',
    });

    await useCase.execute({
      apiKeyId: 'key-1',
      scopeValue: 'admin:all',
    });

    const updated = await repository.findById('key-1');
    const scopes = updated?.getScopes() || [];
    expect(scopes).toHaveLength(3);
    expect(scopes.map((s) => s.value)).toContain('subscriptions:read');
    expect(scopes.map((s) => s.value)).toContain('users:write');
    expect(scopes.map((s) => s.value)).toContain('admin:all');
  });

  it('should handle scope assignment to revoked key', async () => {
    const apiKey = makeApiKey({ id: 'key-1', status: 'revoked' });
    await repository.save(apiKey);

    const result = await useCase.execute({
      apiKeyId: 'key-1',
      scopeValue: 'subscriptions:read',
    });

    expect(result.scope).toBe('subscriptions:read');

    const updated = await repository.findById('key-1');
    const scopes = updated?.getScopes() || [];
    expect(scopes).toHaveLength(1);
  });
});
