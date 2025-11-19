import fastify from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifyScalar from '@scalar/fastify-api-reference'
import { auth } from './lib/auth'

async function bootstrap() {
  const server = fastify({
    logger: true
  })

  // Register Swagger
  await server.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Subscription Tracker API',
        description: 'API for managing subscriptions with Better Auth authentication',
        version: '1.0.0'
      },
      servers: [
        {
          url: 'http://localhost:8080',
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'better-auth.session_token'
          }
        }
      },
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Authentication', description: 'Better Auth endpoints' }
      ]
    }
  })

  // Register Scalar UI
  await server.register(fastifyScalar, {
    routePrefix: '/docs',
    configuration: {
      theme: 'purple',
      darkMode: true
    }
  })

  server.get('/ping', {
    schema: {
      tags: ['Health'],
      description: 'Health check endpoint',
      response: {
        200: {
          type: 'string',
          description: 'Returns pong'
        }
      }
    }
  }, async (request, reply) => {
    return 'pong\n'
  })

  // Register authentication endpoint
  server.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request, reply) {
      try {
        // Construct request URL
        const url = new URL(request.url, `http://${request.headers.host}`);

        // Convert Fastify headers to standard Headers object
        const headers = new Headers();
        Object.entries(request.headers).forEach(([key, value]) => {
          if (value) headers.append(key, value.toString());
        });
        // Create Fetch API-compatible request
        const req = new Request(url.toString(), {
          method: request.method,
          headers,
          body: request.body ? JSON.stringify(request.body) : undefined,
        });
        // Process authentication request
        const response = await auth.handler(req);
        // Forward response to client
        reply.status(response.status);
        response.headers.forEach((value, key) => reply.header(key, value));
        reply.send(response.body ? await response.text() : null);
      } catch (error) {
        console.error("Authentication Error:", error);
        reply.status(500).send({
          error: "Internal authentication error",
          code: "AUTH_FAILURE"
        });
      }
    }
  });

  // Document Better Auth routes for Scalar
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
  } as any, async () => {})

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
  } as any, async () => {})

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
  } as any, async () => {})

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
  } as any, async () => {})

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
  } as any, async () => {})

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
  } as any, async () => {})

  server.listen({ port: 8080 }, (err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`Server listening at ${address}`)
  })
}

bootstrap()