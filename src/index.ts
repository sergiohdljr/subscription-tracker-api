import fastify from 'fastify';
import { swaggerPlugin } from './shared/infrastructure/docs/swagger';
import { betterAuthPlugin } from '@/modules/auth/infrastructure/http/plugins/better-auth-plugin';
import { betterAuthMiddleware } from './shared/infrastructure/http/middlewares/better-auth-middleware';
import { authDocsRoutes } from './modules/auth/infrastructure/http/plugins/auth-docs';
import { subscriptionsRoutes } from './modules/subscriptions/infrastucture/http/routes';
import { setupErrorHandler } from './shared/infrastructure/http/handlers/error-handler';
import { getLogger, createLoggerConfig } from './shared/infrastructure/logging/logger';

async function bootstrap() {
  const loggerConfig = createLoggerConfig();
  const logger = getLogger();

  const server = fastify({
    logger: {
      level: loggerConfig.level,
      ...(loggerConfig.pretty && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }),
    },
  });

  setupErrorHandler(server);

  await server.register(swaggerPlugin);
  await server.register(betterAuthPlugin);
  await server.register(authDocsRoutes);

  // Register authentication middleware
  server.addHook('onRequest', betterAuthMiddleware);
  server.register(subscriptionsRoutes, {
    prefix: '/api',
  });

  // Health check endpoint for Render
  server.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  const port = Number(process.env.PORT) || 8080;
  const host = '0.0.0.0';

  logger.info({ port, host }, 'Starting server');

  try {
    await server.listen({
      port,
      host,
    });
    logger.info(
      {
        port,
        host,
        healthCheck: `http://${host}:${port}/health`,
      },
      'Server started successfully'
    );
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  const logger = getLogger();
  logger.fatal({ err: error }, 'Failed to bootstrap application');
  process.exit(1);
});
