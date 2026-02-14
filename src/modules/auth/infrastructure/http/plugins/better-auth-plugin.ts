import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { auth } from '../../better-auth/better-auth-config';
import { createContextLogger } from '@/shared/infrastructure/logging/logger';

const logger = createContextLogger('better-auth-plugin');

async function betterAuthHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Construct full URL
    const protocol = request.headers['x-forwarded-proto'] || 'http';
    const host = request.headers.host || 'localhost:8080';
    const url = new URL(request.url, `${protocol}://${host}`);

    // Convert Fastify headers to standard Headers object
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          for (const v of value) {
            headers.append(key, v);
          }
        } else {
          headers.append(key, value.toString());
        }
      }
    }

    // Get request body
    let body: string | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (request.body) {
        // If body is already a string, use it; otherwise stringify
        if (typeof request.body === 'string') {
          body = request.body;
        } else {
          body = JSON.stringify(request.body);
          // Ensure content-type is set
          if (!headers.has('content-type')) {
            headers.set('content-type', 'application/json');
          }
        }
      }
    }

    // Create Fetch API-compatible request
    const req = new Request(url.toString(), {
      method: request.method,
      headers,
      body,
    });

    // Process authentication request
    const response = await auth.handler(req);

    // Get response body
    let responseBody: unknown = null;
    const contentType = response.headers.get('content-type');

    if (response.body) {
      if (contentType?.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
    }

    // Forward response to client
    reply.status(response.status);

    // Copy all response headers
    response.headers.forEach((value, key) => {
      reply.header(key, value);
    });

    // Send response body
    if (responseBody !== null) {
      if (typeof responseBody === 'string') {
        reply.type('text/plain').send(responseBody);
      } else {
        reply.type('application/json').send(responseBody);
      }
    } else {
      reply.send();
    }
  } catch (error) {
    logger.error(
      {
        err: error,
        url: request.url,
        method: request.method,
      },
      'Authentication Error'
    );
    reply.status(500).send({
      error: 'Internal authentication error',
      code: 'AUTH_FAILURE',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function betterAuthPlugin(server: FastifyInstance) {
  // Register better-auth handler for all routes under /api/auth
  // Using a plugin with prefix to handle all sub-routes
  await server.register(
    async (fastify) => {
      // Catch-all route for any path under /api/auth
      fastify.all('/*', betterAuthHandler);
    },
    { prefix: '/api/auth' }
  );
}
