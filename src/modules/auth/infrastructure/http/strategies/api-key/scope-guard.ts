import type { FastifyRequest, FastifyReply } from 'fastify';
import { Scope } from '@/modules/identity/domain/entities/scope';
import { InsufficientScopeError } from '@/modules/identity/domain/errors/insufficient-scope.error';
import { createContextLogger } from '@/shared/infrastructure/logging/logger';

const logger = createContextLogger('scope-guard');

/**
 * Checks if the authenticated API key has the required scope
 * Throws InsufficientScopeError if scope is missing
 */
export function requireScope(requiredScope: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.apiKey) {
      logger.warn(
        { path: request.url, method: request.method },
        'API key required for scope check'
      );
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'API key authentication required',
      });
    }

    try {
      const scope = new Scope(requiredScope);
      request.apiKey.apiKey.assertHasScope(scope);
    } catch (error) {
      if (error instanceof InsufficientScopeError) {
        logger.warn(
          {
            apiKeyId: request.apiKey.apiKey.id,
            requiredScope,
            path: request.url,
          },
          'Insufficient scope'
        );
        return reply.status(403).send({
          error: 'Forbidden',
          message: error.message,
        });
      }
      throw error;
    }
  };
}

/**
 * Checks if the authenticated API key has any of the required scopes
 */
export function requireAnyScope(...requiredScopes: string[]) {
  return (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.apiKey) {
      logger.warn(
        { path: request.url, method: request.method },
        'API key required for scope check'
      );
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'API key authentication required',
      });
    }

    const hasAnyScope = requiredScopes.some((scopeValue) => {
      try {
        const scope = new Scope(scopeValue);
        return request.apiKey?.apiKey.hasScope(scope) ?? false;
      } catch {
        return false;
      }
    });

    if (!hasAnyScope) {
      logger.warn(
        {
          apiKeyId: request.apiKey.apiKey.id,
          requiredScopes,
          path: request.url,
        },
        'Insufficient scope (requireAnyScope)'
      );
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Required scope: one of ${requiredScopes.join(', ')}`,
      });
    }
  };
}

/**
 * Checks if the authenticated API key has all of the required scopes
 */
export function requireAllScopes(...requiredScopes: string[]) {
  return (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.apiKey) {
      logger.warn(
        { path: request.url, method: request.method },
        'API key required for scope check'
      );
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'API key authentication required',
      });
    }

    const missingScopes: string[] = [];

    requiredScopes.forEach((scopeValue) => {
      try {
        const scope = new Scope(scopeValue);
        if (!request.apiKey?.apiKey.hasScope(scope)) {
          missingScopes.push(scopeValue);
        }
      } catch {
        missingScopes.push(scopeValue);
      }
    });

    if (missingScopes.length > 0) {
      logger.warn(
        {
          apiKeyId: request.apiKey.apiKey.id,
          missingScopes,
          path: request.url,
        },
        'Insufficient scope (requireAllScopes)'
      );
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Missing required scopes: ${missingScopes.join(', ')}`,
      });
    }
  };
}
