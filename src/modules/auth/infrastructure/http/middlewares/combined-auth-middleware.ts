import type { FastifyRequest, FastifyReply } from "fastify";
import { auth } from "@/modules/auth/infrastructure/better-auth/better-auth-config";
import { createApiKeyGuard } from "../strategies/api-key/api-key.guard";
import { ApiKeyRepository } from "@/modules/identity/application/repositories/api-key-repository";
import { UnauthorizedError, InternalServerError } from "@/shared/infrastructure/http/errors";

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
                throw new UnauthorizedError('Authentication required. Provide a valid session or API key.')
            }

            request.user = session.user;
        } catch (error) {
            // Se já for um HttpError, deixar propagar
            if (error instanceof UnauthorizedError || error instanceof InternalServerError) {
                throw error
            }
            // Erro desconhecido do better-auth
            throw new InternalServerError('Failed to validate authentication')
        }
    };
}

