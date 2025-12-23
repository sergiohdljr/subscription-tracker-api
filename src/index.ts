import fastify from 'fastify'
import { swaggerPlugin } from './plugins/swagger'
import { betterAuthPlugin } from './plugins/better-auth'
import { betterAuthMiddleware } from './plugins/better-auth-middleware'
import { authDocsRoutes } from './routes/auth-docs'
import { subscriptionsRoutes } from './routes/subscriptions.routes'
import { db } from './db'
import { SubscriptionDrizzleRepository } from './modules/subscriptions/subscription.repository'
import { UserDrizzleRepository } from './modules/users/user.repository'
import { FindAllSubscriptionsUseCase } from './modules/subscriptions/use-cases/find-all-subscriptions'
import { SubscriptionController } from './modules/subscriptions/subscription.controller'

async function bootstrap() {
  const server = fastify({
    logger: true
  })

  await server.register(swaggerPlugin)
  await server.register(betterAuthPlugin)
  await server.register(authDocsRoutes)

  // Register authentication middleware
  server.addHook('onRequest', betterAuthMiddleware)

  // Initialize repositories
  const subscriptionRepository = new SubscriptionDrizzleRepository(db)
  const userRepository = new UserDrizzleRepository(db)

  // Initialize use cases
  const findAllSubscriptionsUseCase = new FindAllSubscriptionsUseCase(
    subscriptionRepository,
    userRepository
  )

  // Initialize controllers
  const subscriptionController = new SubscriptionController(
    findAllSubscriptionsUseCase
  )

  // Register routes
  await server.register(async (fastify) => {
    await subscriptionsRoutes(fastify, subscriptionController)
  })

  server.listen({ port: 8080 }, (err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`Server listening at ${address}`)
  })
}

bootstrap()