import { FastifyInstance } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifyScalar from '@scalar/fastify-api-reference'

export async function swaggerPlugin(server: FastifyInstance) {
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
}
