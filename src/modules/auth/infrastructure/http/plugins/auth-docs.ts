import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { auth } from '../../better-auth/better-auth-config'
import { createContextLogger } from '@/shared/infrastructure/logging/logger'

const logger = createContextLogger('auth-docs')

async function betterAuthHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Construct full URL
    const protocol = request.headers['x-forwarded-proto'] || 'http';
    const host = request.headers.host || 'localhost:8080';
    const url = new URL(request.url, `${protocol}://${host}`);

    // Convert Fastify headers to standard Headers object
    const headers = new Headers();
    Object.entries(request.headers).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(v => headers.append(key, v));
        } else {
          headers.append(key, value.toString());
        }
      }
    });

    // Get request body
    let body: string | undefined ;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (request.body) {
        if (typeof request.body === 'string') {
          body = request.body;
        } else {
          body = JSON.stringify(request.body);
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
    let responseBody: any = null;
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
    response.headers.forEach((value, key) => {
      reply.header(key, value);
    });

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
    logger.error({ 
      err: error,
      url: request.url,
      method: request.method
    }, 'Authentication Error')
    reply.status(500).send({
      error: "Internal authentication error",
      code: "AUTH_FAILURE",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function authDocsRoutes(server: FastifyInstance) {
  // Document Better Auth routes for Scalar - these routes delegate to better-auth
  server.post('/api/auth/sign-up/email', {
    schema: {
      tags: ['Authentication'],
      description: 'Create a new user account with email and password',
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                emailVerified: { type: 'boolean' },
                createdAt: { type: 'string' }
              }
            },
            session: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                expiresAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  } as any, betterAuthHandler)

  server.post('/api/auth/sign-in/email', {
    schema: {
      tags: ['Authentication'],
      description: 'Sign in with email and password',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                emailVerified: { type: 'boolean' }
              }
            },
            session: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                expiresAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  } as any, betterAuthHandler)

  server.get('/api/auth/get-session', {
    schema: {
      tags: ['Authentication'],
      description: 'Get current user session',
      security: [{ cookieAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                emailVerified: { type: 'boolean' },
                createdAt: { type: 'string' }
              }
            },
            session: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                token: { type: 'string' },
                expiresAt: { type: 'string' },
                userId: { type: 'string' }
              }
            }
          }
        }
      }
    }
  } as any, betterAuthHandler)

  server.post('/api/auth/sign-out', {
    schema: {
      tags: ['Authentication'],
      description: 'Sign out and invalidate session',
      security: [{ cookieAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }
          }
        }
      }
    }
  } as any, betterAuthHandler)

  server.post('/api/auth/forget-password', {
    schema: {
      tags: ['Authentication'],
      description: 'Request password reset email',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }
          }
        }
      }
    }
  } as any, betterAuthHandler)

  server.post('/api/auth/reset-password', {
    schema: {
      tags: ['Authentication'],
      description: 'Reset password with token',
      body: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string' },
          password: { type: 'string', minLength: 8 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }
          }
        }
      }
    }
  } as any, betterAuthHandler)
}
