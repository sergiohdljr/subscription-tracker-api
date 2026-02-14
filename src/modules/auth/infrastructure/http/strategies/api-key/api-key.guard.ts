import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ApiKeyRepository } from '@/modules/identity/application/repositories/api-key-repository';
import { ApiKeyHash } from '@/modules/identity/domain/value-objects/api-key-hash';
import type { ApiKeyContext } from './api-key.context';
import { ApiKeyExpiredError } from '@/modules/identity/domain/errors/api-key-expired.error';
import { ApiKeyRevokedError } from '@/modules/identity/domain/errors/api-key-revoked.error';
import { createContextLogger } from '@/shared/infrastructure/logging/logger';

const logger = createContextLogger('api-key-guard');

/**
 * Extracts API key from request headers
 * Supports only:
 * - X-API-Key: <api-key>
 */
function extractApiKeyFromRequest(request: FastifyRequest): string | null {
  const apiKeyHeader = request.headers['x-api-key'];
  if (apiKeyHeader) {
    return Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
  }

  return null;
}

/**
 * API Key Guard Middleware
 * Validates API key from request and attaches context to request
 */
export async function apiKeyGuard(
  request: FastifyRequest,
  reply: FastifyReply,
  apiKeyRepository: ApiKeyRepository
): Promise<void> {
  // Extract API key from request
  const plainApiKey = extractApiKeyFromRequest(request);

  if (!plainApiKey) {
    logger.warn({ path: request.url, method: request.method }, 'API key missing from request');
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'API key is required. Provide it via X-API-Key header',
    });
  }

  try {
    // Hash the API key
    const hash = ApiKeyHash.fromPlain(plainApiKey);

    // Find API key in repository
    const apiKey = await apiKeyRepository.findByHash(hash.toString());

    if (!apiKey) {
      logger.warn({ path: request.url, method: request.method }, 'Invalid API key');
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
    }

    // Validate API key is usable (not revoked, not expired)
    try {
      apiKey.assertUsable();
    } catch (error) {
      if (error instanceof ApiKeyRevokedError) {
        logger.warn({ apiKeyId: apiKey.id, path: request.url }, 'Revoked API key attempt');
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'API key has been revoked',
        });
      }
      if (error instanceof ApiKeyExpiredError) {
        logger.warn({ apiKeyId: apiKey.id, path: request.url }, 'Expired API key attempt');
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'API key has expired',
        });
      }
      throw error;
    }

    // Mark API key as used
    apiKey.markAsUsed();
    await apiKeyRepository.update(apiKey);

    // Attach API key context to request
    const context: ApiKeyContext = {
      apiKey,
      ownerId: apiKey.owner,
      scopes: apiKey.getScopes().map((scope) => scope.value),
    };

    request.apiKey = context;

    logger.debug(
      { apiKeyId: apiKey.id, ownerId: apiKey.owner, path: request.url },
      'API key authenticated'
    );
  } catch (error) {
    // Handle invalid API key format
    if (error instanceof Error && error.message === 'Invalid API key') {
      logger.warn({ path: request.url }, 'Invalid API key format');
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid API key format',
      });
    }

    logger.error({ err: error, path: request.url }, 'Failed to validate API key');
    return reply.status(500).send({
      error: 'Internal server error',
      message: 'Failed to validate API key',
    });
  }
}

/**
 * Creates an API Key Guard middleware factory
 * Returns a middleware function that uses the provided repository
 */
export function createApiKeyGuard(apiKeyRepository: ApiKeyRepository) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    return apiKeyGuard(request, reply, apiKeyRepository);
  };
}
