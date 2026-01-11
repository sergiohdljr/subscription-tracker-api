import { FastifyInstance } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifyScalar from '@scalar/fastify-api-reference'

export async function swaggerPlugin(server: FastifyInstance) {
  // Register Swagger plugin
  await server.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Subscription Tracker API',
        description: 'API for managing subscriptions with Better Auth authentication',
        version: '1.0.0'
      },
      servers: [
        {
          url: 'http://localhost:8080/',
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

  server.addHook('onReady', async function () {
    const spec = server.swagger()

    if (!spec.paths) spec.paths = {}

    spec.paths['/api/auth/sign-up/email'] = {
      post: {
        tags: ['Authentication'],
        summary: 'Sign up with email',
        description: 'Create a new user account with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'User created successfully'
          }
        }
      }
    }

    spec.paths['/api/auth/sign-in/email'] = {
      post: {
        tags: ['Authentication'],
        summary: 'Sign in with email',
        description: 'Sign in with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Signed in successfully'
          }
        }
      }
    }

    spec.paths['/api/auth/get-session'] = {
      get: {
        tags: ['Authentication'],
        summary: 'Get session',
        description: 'Get current user session',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Session retrieved successfully'
          }
        }
      }
    }

    spec.paths['/api/auth/sign-out'] = {
      post: {
        tags: ['Authentication'],
        summary: 'Sign out',
        description: 'Sign out and invalidate session',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Signed out successfully'
          }
        }
      }
    }
  })

  // Register Scalar UI
  await server.register(fastifyScalar, {
    routePrefix: '/docs',
    configuration: {
      theme: 'purple',
      darkMode: false
    }
  })
}
