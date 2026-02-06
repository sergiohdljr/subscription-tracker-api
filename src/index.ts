import fastify from 'fastify'
import { swaggerPlugin } from './shared/infrastructure/docs/swagger'
import { betterAuthPlugin } from '@/modules/auth/infrastructure/http/plugins/better-auth-plugin'
import { betterAuthMiddleware } from './shared/infrastructure/http/middlewares/better-auth-middleware'
import { authDocsRoutes } from './modules/auth/infrastructure/http/plugins/auth-docs'
import { subscriptionsRoutes } from './modules/subscriptions/infrastucture/http/routes'


async function bootstrap() {
  const server = fastify({
    logger: true
  })

  await server.register(swaggerPlugin)
  await server.register(betterAuthPlugin)
  await server.register(authDocsRoutes)

  // Register authentication middleware
  server.addHook('onRequest', betterAuthMiddleware)
  server.register(subscriptionsRoutes, {
    prefix: "/api"
  })

  // Health check endpoint for Render
  server.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  })

  const port = Number(process.env.PORT) || 8080
  // Sempre usar 0.0.0.0 para aceitar conexões externas no Render
  const host = '0.0.0.0'

  try {
    await server.listen({
      port,
      host
    })
    console.log(`Server listening on http://${host}:${port}`)
    console.log(`Health check available at http://${host}:${port}/health`)
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap application:', error)
  process.exit(1)
})