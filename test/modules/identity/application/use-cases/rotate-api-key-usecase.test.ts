import { RotateApiKeyUseCase } from '@/modules/identity/application/use-cases/rotate-api-key-usecase';
import { InMemoryApiKeyRepository } from '@/modules/identity/infrastructure/repositories/in-memory-api-key-repository';
import { ApiKey } from '@/modules/identity/domain/entities/api-key';
import { Scope } from '@/modules/identity/domain/entities/scope';
import { ApiKeyNotFoundError } from '@/modules/identity/domain/errors/api-key-not-found.error';
import { ApiKeyRevokedError } from '@/modules/identity/domain/errors/api-key-revoked.error';

function makeApiKey(params: {
  id?: string;
  hash?: string;
  owner?: string;
  status?: 'active' | 'revoked';
  expiresAt?: Date | null;
  scopes?: Scope[];
}): ApiKey {
  const now = new Date('2024-01-01T00:00:00.000Z');
  const apiKey = new ApiKey(
    params.id ?? 'api-key-1',
    params.hash ?? 'hash-123',
    params.owner ?? 'user-1',
    params.status ?? 'active',
    params.expiresAt ?? null,
    now,
    null
  );

  if (params.scopes) {
    for (const scope of params.scopes) {
      apiKey.addScope(scope);
    }
  }

  return apiKey;
}

describe('RotateApiKeyUseCase', () => {
  let useCase: RotateApiKeyUseCase;
  let repository: InMemoryApiKeyRepository;

  beforeEach(() => {
    repository = new InMemoryApiKeyRepository();
    useCase = new RotateApiKeyUseCase(repository);
  });

  it('should rotate an API key and revoke the old one', async () => {
    const oldKey = makeApiKey({ id: 'old-key-1' });
    await repository.save(oldKey);

    const result = await useCase.execute({ apiKeyId: 'old-key-1' });

    expect(result.oldKeyId).toBe('old-key-1');
    expect(result.newKeyId).toBeDefined();
    expect(result.newKeyId).not.toBe('old-key-1');
    expect(result.apiKey).toMatch(/^sk_live_[a-f0-9]+$/);
    expect(result.ownerId).toBe('user-1');

    // Old key should be revoked
    const oldKeyAfter = await repository.findById('old-key-1');
    expect(oldKeyAfter?.getStatus()).toBe('revoked');

    // New key should be active
    const newKey = await repository.findById(result.newKeyId);
    expect(newKey?.getStatus()).toBe('active');
  });

  it('should copy scopes from old key to new key by default', async () => {
    const scope1 = new Scope('subscriptions:read');
    const scope2 = new Scope('subscriptions:write');
    const oldKey = makeApiKey({
      id: 'old-key-1',
      scopes: [scope1, scope2],
    });
    await repository.save(oldKey);
    await repository.update(oldKey); // Sync scopes

    const result = await useCase.execute({
      apiKeyId: 'old-key-1',
      keepScopes: true,
    });

    expect(result.scopes).toHaveLength(2);
    expect(result.scopes).toContain('subscriptions:read');
    expect(result.scopes).toContain('subscriptions:write');

    const newKey = await repository.findById(result.newKeyId);
    const newKeyScopes = newKey?.getScopes() || [];
    expect(newKeyScopes).toHaveLength(2);
  });

  it('should not copy scopes when keepScopes is false', async () => {
    const scope1 = new Scope('subscriptions:read');
    const oldKey = makeApiKey({
      id: 'old-key-1',
      scopes: [scope1],
    });
    await repository.save(oldKey);
    await repository.update(oldKey); // Sync scopes

    const result = await useCase.execute({
      apiKeyId: 'old-key-1',
      keepScopes: false,
    });

    expect(result.scopes).toHaveLength(0);

    const newKey = await repository.findById(result.newKeyId);
    const newKeyScopes = newKey?.getScopes() || [];
    expect(newKeyScopes).toHaveLength(0);
  });

  it('should copy expiration date from old key if not provided', async () => {
    const expiresAt = new Date('2025-12-31T23:59:59.000Z');
    const oldKey = makeApiKey({
      id: 'old-key-1',
      expiresAt,
    });
    await repository.save(oldKey);

    const result = await useCase.execute({ apiKeyId: 'old-key-1' });

    expect(result.expiresAt).toEqual(expiresAt);
  });

  it('should use new expiration date if provided', async () => {
    const oldExpiresAt = new Date('2025-12-31T23:59:59.000Z');
    const newExpiresAt = new Date('2026-12-31T23:59:59.000Z');
    const oldKey = makeApiKey({
      id: 'old-key-1',
      expiresAt: oldExpiresAt,
    });
    await repository.save(oldKey);

    const result = await useCase.execute({
      apiKeyId: 'old-key-1',
      expiresAt: newExpiresAt,
    });

    expect(result.expiresAt).toEqual(newExpiresAt);
  });

  it('should use provided name for new key', async () => {
    const oldKey = makeApiKey({ id: 'old-key-1' });
    await repository.save(oldKey);

    const result = await useCase.execute({
      apiKeyId: 'old-key-1',
      name: 'Rotated Key',
    });

    expect(result.name).toBe('Rotated Key');
  });

  it('should throw error if old key does not exist', async () => {
    await expect(useCase.execute({ apiKeyId: 'non-existent' })).rejects.toThrow(
      ApiKeyNotFoundError
    );
  });

  it('should throw error if old key is already revoked', async () => {
    const oldKey = makeApiKey({ id: 'old-key-1', status: 'revoked' });
    await repository.save(oldKey);
    oldKey.revoke();
    await repository.update(oldKey);

    await expect(useCase.execute({ apiKeyId: 'old-key-1' })).rejects.toThrow(ApiKeyRevokedError);
  });

  it('should generate unique new keys for each rotation', async () => {
    const oldKey = makeApiKey({ id: 'old-key-1' });
    await repository.save(oldKey);

    const result1 = await useCase.execute({ apiKeyId: 'old-key-1' });

    // Rotate the new key
    const result2 = await useCase.execute({ apiKeyId: result1.newKeyId });

    expect(result1.apiKey).not.toBe(result2.apiKey);
    expect(result1.newKeyId).not.toBe(result2.newKeyId);
  });
});
