import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CreateSubscriptionController } from '../controllers/create-subscription-controller';
import { CreateSubscriptionUseCase } from '@/modules/subscriptions/application/use-cases/create-subscription-usecase';
import { SubscriptionsDrizzleRepository } from '@/modules/subscriptions/infrastucture/repositories/subscriptions-drizzle-repository';
import { drizzleUserRepository } from '@/modules/user/infrastructure/repositories/drizzle-user-repository';
import { db } from '@/shared/infrastructure/db/drizzle/connection-pool';
import { ListSubscriptionsUseCase } from '@/modules/subscriptions/application/use-cases/list-subscriptions';
import { ListSubscriptionsController } from '../controllers/list-subscriptions-controller';
import { ProcessRenewalsUseCase } from '@/modules/subscriptions/application/use-cases/scheduled/ process-renewals';
import { ProcessRenewalsController } from '../controllers/process-renewals-controller';
import { ApiKeyDrizzleRepository } from '@/modules/identity/infrastructure/repositories/api-key-drizzle-repository';
import { createApiKeyGuard } from '@/modules/auth/infrastructure/http/strategies/api-key/api-key.guard';
import { requireScope } from '@/modules/auth/infrastructure/http/strategies/api-key/scope-guard';

export async function subscriptionsRoutes(app: FastifyInstance) {
  // Infra
  const subscriptionsRepository = new SubscriptionsDrizzleRepository(db);

  const userRepository = new drizzleUserRepository(db);

  // Use case
  const createSubscriptionUseCase = new CreateSubscriptionUseCase(
    subscriptionsRepository,
    userRepository
  );

  const listSubscriptionUseCase = new ListSubscriptionsUseCase(
    subscriptionsRepository,
    userRepository
  );

  // Controller
  const createSubscriptionController = new CreateSubscriptionController(createSubscriptionUseCase);

  const listSubscriptionsController = new ListSubscriptionsController(listSubscriptionUseCase);

  const processRenewalsUseCase = new ProcessRenewalsUseCase(subscriptionsRepository);

  const processRenewalsController = new ProcessRenewalsController(processRenewalsUseCase);

  const apiKeyRepository = new ApiKeyDrizzleRepository(db);
  const apiKeyGuard = createApiKeyGuard(apiKeyRepository);

  // Routes
  app.post('/subscriptions', async (request, reply) =>
    createSubscriptionController.handle(request, reply)
  );

  app.get('/subscriptions', async (request, reply) =>
    listSubscriptionsController.handle(request, reply)
  );

  app.post(
    '/subscriptions/process-renewals',
    {
      preHandler: [apiKeyGuard, requireScope('scheduled:process-renewals')],
    },
    async (request: FastifyRequest, reply: FastifyReply) =>
      processRenewalsController.handle(request, reply)
  );
}
