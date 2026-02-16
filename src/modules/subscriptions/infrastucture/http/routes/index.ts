import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SubscriptionFactory } from '../../factories/subscription-factory';
import { requireScope } from '@/modules/auth/infrastructure/http/strategies/api-key/scope-guard';

export async function subscriptionsRoutes(app: FastifyInstance) {
  // Create controllers and guards using factory
  // Routes
  app.post('/subscriptions', async (request, reply) =>
    SubscriptionFactory.createCreateSubscriptionController().handle(request, reply)
  );

  app.get('/subscriptions', async (request, reply) =>
    SubscriptionFactory.createListSubscriptionsController().handle(request, reply)
  );

  app.post(
    '/subscriptions/process-renewals',
    {
      preHandler: [
        SubscriptionFactory.createApiKeyGuard(),
        requireScope('scheduled:process-renewals'),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) =>
      SubscriptionFactory.createProcessRenewalsController().handle(request, reply)
  );

  app.post(
    '/subscriptions/notify',
    {
      preHandler: [
        SubscriptionFactory.createApiKeyGuard(),
        requireScope('scheduled:process-renewals'),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) =>
      SubscriptionFactory.createNotifySubscriptionsController().handle(request, reply)
  );
}
