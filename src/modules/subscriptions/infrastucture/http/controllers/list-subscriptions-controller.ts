import type { ListSubscriptionsUseCase } from '@/modules/subscriptions/application/use-cases/list-subscriptions';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { UnauthorizedError } from '@/shared/infrastructure/http/errors';

export class ListSubscriptionsController {
  constructor(private readonly listSubscriptionUseCase: ListSubscriptionsUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedError('User not found');
    }

    const subscriptions = await this.listSubscriptionUseCase.run(userId);
    return reply.status(200).send(subscriptions);
  }
}
