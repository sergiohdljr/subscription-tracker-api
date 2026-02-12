import {
  apiKeyGuard,
  createApiKeyGuard,
} from '@/modules/auth/infrastructure/http/strategies/api-key/api-key.guard';
import { InMemoryApiKeyRepository } from '@/modules/identity/infrastructure/repositories/in-memory-api-key-repository';
import { ApiKey } from '@/modules/identity/domain/entities/api-key';
import { Scope } from '@/modules/identity/domain/entities/scope';
import { ApiKeyHash } from '@/modules/identity/domain/value-objects/api-key-hash';
import type { FastifyRequest, FastifyReply } from 'fastify';

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
    params.scopes.forEach((scope) => apiKey.addScope(scope));
  }

  return apiKey;
}

function makeRequest(headers: Record<string, string> = {}): FastifyRequest {
  return {
    headers,
    apiKey: undefined,
  } as FastifyRequest;
}

function makeReply(): FastifyReply {
  const reply = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as FastifyReply;
  return reply;
}

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('apiKeyGuard', () => {
  let repository: InMemoryApiKeyRepository;
  let reply: FastifyReply;

  beforeEach(() => {
    repository = new InMemoryApiKeyRepository();
    reply = makeReply();
  });

  it('should return 401 when X-API-Key header is missing', async () => {
    const request = makeRequest();

    await apiKeyGuard(request, reply, repository);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'API key is required. Provide it via X-API-Key header',
    });
  });

  it('should return 401 when API key is invalid', async () => {
    const request = makeRequest({
      'x-api-key': 'invalid-key',
    });

    await apiKeyGuard(request, reply, repository);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Invalid API key format',
    });
  });

  it('should authenticate valid API key and attach context', async () => {
    const plainApiKey = 'sk_live_test123456789012345678901234567890';
    const hash = ApiKeyHash.fromPlain(plainApiKey);
    const apiKey = makeApiKey({
      id: 'key-1',
      hash: hash.toString(),
      owner: 'user-1',
    });
    await repository.save(apiKey);
    await repository.update(apiKey);

    const request = makeRequest({
      'x-api-key': plainApiKey,
    });

    await apiKeyGuard(request, reply, repository);

    expect(request.apiKey).toBeDefined();
    expect(request.apiKey?.ownerId).toBe('user-1');
    expect(request.apiKey?.apiKey.id).toBe('key-1');
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('should return 401 when API key is revoked', async () => {
    const plainApiKey = 'sk_live_test123456789012345678901234567890';
    const hash = ApiKeyHash.fromPlain(plainApiKey);
    const apiKey = makeApiKey({
      id: 'key-1',
      hash: hash.toString(),
      status: 'revoked',
    });
    await repository.save(apiKey);
    apiKey.revoke();
    await repository.update(apiKey);

    const request = makeRequest({
      'x-api-key': plainApiKey,
    });

    await apiKeyGuard(request, reply, repository);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'API key has been revoked',
    });
  });

  it('should return 401 when API key is expired', async () => {
    const plainApiKey = 'sk_live_test123456789012345678901234567890';
    const hash = ApiKeyHash.fromPlain(plainApiKey);
    const expiredDate = new Date('2020-01-01T00:00:00.000Z');
    const apiKey = makeApiKey({
      id: 'key-1',
      hash: hash.toString(),
      expiresAt: expiredDate,
    });
    await repository.save(apiKey);
    await repository.update(apiKey);

    const request = makeRequest({
      'x-api-key': plainApiKey,
    });

    await apiKeyGuard(request, reply, repository);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'API key has expired',
    });
  });

  it('should attach scopes to context', async () => {
    const plainApiKey = 'sk_live_test123456789012345678901234567890';
    const hash = ApiKeyHash.fromPlain(plainApiKey);
    const scope1 = new Scope('subscriptions:read');
    const scope2 = new Scope('subscriptions:write');
    const apiKey = makeApiKey({
      id: 'key-1',
      hash: hash.toString(),
      scopes: [scope1, scope2],
    });
    await repository.save(apiKey);
    await repository.update(apiKey);

    const request = makeRequest({
      'x-api-key': plainApiKey,
    });

    await apiKeyGuard(request, reply, repository);

    expect(request.apiKey?.scopes).toHaveLength(2);
    expect(request.apiKey?.scopes).toContain('subscriptions:read');
    expect(request.apiKey?.scopes).toContain('subscriptions:write');
  });

  it('should return 401 for invalid API key format', async () => {
    const request = makeRequest({
      'x-api-key': 'too-short',
    });

    await apiKeyGuard(request, reply, repository);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Invalid API key format',
    });
  });

  it('should mark API key as used after authentication', async () => {
    const plainApiKey = 'sk_live_test123456789012345678901234567890';
    const hash = ApiKeyHash.fromPlain(plainApiKey);
    const apiKey = makeApiKey({
      id: 'key-1',
      hash: hash.toString(),
    });
    await repository.save(apiKey);
    await repository.update(apiKey);

    const request = makeRequest({
      'x-api-key': plainApiKey,
    });

    await apiKeyGuard(request, reply, repository);

    const updated = await repository.findById('key-1');
    expect(updated?.getLastUsedAt()).not.toBeNull();
  });
});

describe('createApiKeyGuard', () => {
  it('should create a guard function', () => {
    const repository = new InMemoryApiKeyRepository();
    const guard = createApiKeyGuard(repository);

    expect(typeof guard).toBe('function');
  });
});
