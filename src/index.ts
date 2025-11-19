import fastify from 'fastify'
import { swaggerPlugin } from './plugins/swagger'
import { betterAuthPlugin } from './plugins/better-auth'
import { authDocsRoutes } from './routes/auth-docs'

async function bootstrap() {
  const server = fastify({
    logger: true
  })

  // Register plugins
  await server.register(swaggerPlugin)
  await server.register(betterAuthPlugin)

  // Register routes
  await server.register(authDocsRoutes)

  server.listen({ port: 8080 }, (err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`Server listening at ${address}`)
  })
}

bootstrap()