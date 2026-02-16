import type { FastifyRequest, FastifyReply } from 'fastify';
import { auth } from '@/modules/auth/infrastructure/better-auth/better-auth-config';
import { UnauthorizedError, InternalServerError } from '../errors';
import { createContextLogger } from '../../logging/logger';

const logger = createContextLogger('better-auth-middleware');

export async function betterAuthMiddleware(request: FastifyRequest, _reply: FastifyReply) {
  if (
    request.url.startsWith('/api/auth/') ||
    request.url.startsWith('/docs') ||
    request.url.startsWith('/documentation') ||
    request.url.startsWith('/health') ||
    request.url.startsWith('/api/subscriptions/process-renewals') ||
    request.url.startsWith('/api/subscriptions/notify')
  ) {
    return;
  }

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      logger.warn({ path: request.url, method: request.method }, 'Session authentication failed');
      throw new UnauthorizedError('Authentication required');
    }

    request.user = session.user;
  } catch (error) {
    // Se já for um HttpError, deixar propagar
    if (error instanceof UnauthorizedError || error instanceof InternalServerError) {
      throw error;
    }
    // Erro desconhecido do better-auth
    logger.error({ err: error, path: request.url }, 'Failed to validate session authentication');
    throw new InternalServerError('Failed to validate authentication');
  }
}
