import fastify from 'fastify'
import { swaggerPlugin } from './shared/infrastructure/docs/swagger'
import { betterAuthPlugin } from '@/modules/auth/infrastructure/http/plugins/better-auth-plugin'
import { betterAuthMiddleware } from './shared/infrastructure/http/middlewares/better-auth-middleware'
import { authDocsRoutes } from './modules/auth/infrastructure/http/plugins/auth-docs'
import { subscriptionsRoutes } from './modules/subscriptions/infrastucture/http/routes'


async function bootstrap() {
  const server = fastify()

  await server.register(swaggerPlugin)
  await server.register(betterAuthPlugin)
  await server.register(authDocsRoutes)

  // Register authentication middleware
  server.addHook('onRequest', betterAuthMiddleware)
  server.register(subscriptionsRoutes, {
    prefix: "/api"
  })

  const port = Number(process.env.PORT) || 8080
  const host = process.env.HOST || '0.0.0.0'

  server.listen({ port, host }, (err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`Server listening at ${address}`)
  })
}

bootstrap()