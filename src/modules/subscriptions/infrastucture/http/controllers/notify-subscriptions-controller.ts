import type { FastifyRequest, FastifyReply } from 'fastify';
import type { NotifySubscriptionsUseCase } from '@/modules/subscriptions/application/use-cases/scheduled/notify-subscriptions';

export class NotifySubscriptionsController {
  constructor(private readonly notifySubscriptionsUseCase: NotifySubscriptionsUseCase) {}

  async handle(_request: FastifyRequest, reply: FastifyReply) {
    const today = new Date();
    const daysBefore = 10; // Default value, can be made configurable via query params if needed

    await this.notifySubscriptionsUseCase.run(daysBefore, today);

    return reply.status(200).send({
      message: 'Subscription notifications processed successfully',
      date: today.toISOString(),
      daysBefore,
    });
  }
}
