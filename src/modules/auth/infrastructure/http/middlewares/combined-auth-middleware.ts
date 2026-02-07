import type { FastifyRequest, FastifyReply } from "fastify";
import { auth } from "@/modules/auth/infrastructure/better-auth/better-auth-config";
import { createApiKeyGuard } from "../strategies/api-key/api-key.guard";
import { ApiKeyRepository } from "@/modules/identity/application/repositories/api-key-repository";

/**
 * Combined Authentication Middleware
 * Tries API Key authentication first, then falls back to session authentication
 * Allows routes to accept either authentication method
 */
export function createCombinedAuthMiddleware(apiKeyRepository: ApiKeyRepository) {
    const apiKeyGuard = createApiKeyGuard(apiKeyRepository);

    return async (request: FastifyRequest, reply: FastifyReply) => {
        // Skip authentication for public routes
        if (
            request.url.startsWith('/api/auth/') ||
            request.url.startsWith('/docs') ||
            request.url.startsWith('/documentation') ||
            request.url.startsWith('/health')
        ) {
            return;
        }

        // Try API Key authentication first
        const hasApiKey = request.headers['x-api-key'];

        if (hasApiKey) {
            return apiKeyGuard(request, reply);
        }

        // Fall back to session authentication
        try {
            const session = await auth.api.getSession({
                headers: request.headers
            });

            if (!session) {
                return reply.status(401).send({
                    error: 'Unauthorized',
                    message: 'Authentication required. Provide a valid session or API key.'
                });
            }

            request.user = session.user;
        } catch (error) {
            return reply.status(500).send({
                error: 'Internal server error',
                message: 'Failed to validate authentication'
            });
        }
    };
}

