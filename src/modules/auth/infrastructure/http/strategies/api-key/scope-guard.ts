import type { FastifyRequest, FastifyReply } from 'fastify';
import { Scope } from '@/modules/identity/domain/entities/scope';
import { InsufficientScopeError } from '@/modules/identity/domain/errors/insufficient-scope.error';

/**
 * Checks if the authenticated API key has the required scope
 * Throws InsufficientScopeError if scope is missing
 */
export function requireScope(requiredScope: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.apiKey) {
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
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Missing required scopes: ${missingScopes.join(', ')}`,
      });
    }
  };
}
