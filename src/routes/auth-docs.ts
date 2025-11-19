import { FastifyInstance } from 'fastify'

export async function authDocsRoutes(server: FastifyInstance) {
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
}
