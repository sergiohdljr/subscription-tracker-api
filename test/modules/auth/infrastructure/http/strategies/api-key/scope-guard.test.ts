import {
  requireScope,
  requireAnyScope,
  requireAllScopes,
} from '@/modules/auth/infrastructure/http/strategies/api-key/scope-guard';
import { ApiKey } from '@/modules/identity/domain/entities/api-key';
import { Scope } from '@/modules/identity/domain/entities/scope';
import type { FastifyRequest, FastifyReply } from 'fastify';

function makeApiKey(scopes: Scope[] = []): ApiKey {
  const apiKey = new ApiKey('key-1', 'hash-123', 'user-1', 'active', null, new Date(), null);

  for (const scope of scopes) {
    apiKey.addScope(scope);
  }

  return apiKey;
}

function makeRequest(apiKey?: ApiKey): FastifyRequest {
  return {
    apiKey: apiKey
      ? {
          apiKey,
          ownerId: apiKey.owner,
          scopes: apiKey.getScopes().map((s) => s.value),
        }
      : undefined,
  } as FastifyRequest;
}

function makeReply(): FastifyReply {
  const reply = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as FastifyReply;
  return reply;
}

describe('requireScope', () => {
  it('should return 401 when apiKey is not present', () => {
    const request = makeRequest();
    const reply = makeReply();
    const guard = requireScope('subscriptions:read');

    guard(request, reply);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'API key authentication required',
    });
  });

  it('should pass when API key has required scope', () => {
    const scope = new Scope('subscriptions:read');
    const apiKey = makeApiKey([scope]);
    const request = makeRequest(apiKey);
    const reply = makeReply();
    const guard = requireScope('subscriptions:read');

    guard(request, reply);

    expect(reply.status).not.toHaveBeenCalled();
  });

  it('should return 403 when API key lacks required scope', () => {
    const scope = new Scope('subscriptions:read');
    const apiKey = makeApiKey([scope]);
    const request = makeRequest(apiKey);
    const reply = makeReply();
    const guard = requireScope('subscriptions:write');

    guard(request, reply);

    expect(reply.status).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: expect.stringContaining('Insufficient scope'),
    });
  });
});

describe('requireAnyScope', () => {
  it('should return 401 when apiKey is not present', () => {
    const request = makeRequest();
    const reply = makeReply();
    const guard = requireAnyScope('subscriptions:read', 'subscriptions:write');

    guard(request, reply);

    expect(reply.status).toHaveBeenCalledWith(401);
  });

  it('should pass when API key has at least one required scope', () => {
    const scope = new Scope('subscriptions:read');
    const apiKey = makeApiKey([scope]);
    const request = makeRequest(apiKey);
    const reply = makeReply();
    const guard = requireAnyScope('subscriptions:read', 'subscriptions:write');

    guard(request, reply);

    expect(reply.status).not.toHaveBeenCalled();
  });

  it('should return 403 when API key has none of the required scopes', () => {
    const scope = new Scope('users:read');
    const apiKey = makeApiKey([scope]);
    const request = makeRequest(apiKey);
    const reply = makeReply();
    const guard = requireAnyScope('subscriptions:read', 'subscriptions:write');

    guard(request, reply);

    expect(reply.status).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: expect.stringContaining('Required scope: one of'),
    });
  });
});

describe('requireAllScopes', () => {
  it('should return 401 when apiKey is not present', () => {
    const request = makeRequest();
    const reply = makeReply();
    const guard = requireAllScopes('subscriptions:read', 'subscriptions:write');

    guard(request, reply);

    expect(reply.status).toHaveBeenCalledWith(401);
  });

  it('should pass when API key has all required scopes', () => {
    const scope1 = new Scope('subscriptions:read');
    const scope2 = new Scope('subscriptions:write');
    const apiKey = makeApiKey([scope1, scope2]);
    const request = makeRequest(apiKey);
    const reply = makeReply();
    const guard = requireAllScopes('subscriptions:read', 'subscriptions:write');

    guard(request, reply);

    expect(reply.status).not.toHaveBeenCalled();
  });

  it('should return 403 when API key is missing any required scope', () => {
    const scope = new Scope('subscriptions:read');
    const apiKey = makeApiKey([scope]);
    const request = makeRequest(apiKey);
    const reply = makeReply();
    const guard = requireAllScopes('subscriptions:read', 'subscriptions:write');

    guard(request, reply);

    expect(reply.status).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: expect.stringContaining('Missing required scopes'),
    });
  });
});
