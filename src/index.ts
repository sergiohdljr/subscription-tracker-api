import fastify from 'fastify'
import { swaggerPlugin } from './shared/infrastructure/docs/swagger'
import { betterAuthPlugin } from '@/modules/auth/infrastructure/http/plugins/better-auth-plugin'
import { betterAuthMiddleware } from './shared/infrastructure/http/middlewares/better-auth-middleware'
import { authDocsRoutes } from './modules/auth/infrastructure/http/plugins/auth-docs'


async function bootstrap() {
  const server = fastify({
    logger: true
  })

  await server.register(swaggerPlugin)
  await server.register(betterAuthPlugin)
  await server.register(authDocsRoutes)

  // Register authentication middleware
  server.addHook('onRequest', betterAuthMiddleware)

  server.listen({ port: 8080 }, (err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`Server listening at ${address}`)
  })
}

bootstrap()