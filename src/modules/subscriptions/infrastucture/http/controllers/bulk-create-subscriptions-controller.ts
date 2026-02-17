import type { FastifyRequest, FastifyReply } from 'fastify';
import type { BulkCreateSubscriptionsUseCase } from '@/modules/subscriptions/application/use-cases/bulk-create-subscriptions-usecase';
import { BadRequestError, UnauthorizedError } from '@/shared/infrastructure/http/errors';
import { createContextLogger } from '@/shared/infrastructure/logging/logger';
import type { BulkCreateSubscriptionInput } from '../schemas/bulk-create-subscription.schema';

const logger = createContextLogger('bulk-create-subscriptions-controller');

export class BulkCreateSubscriptionsController {
  constructor(private readonly bulkCreateUseCase: BulkCreateSubscriptionsUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const userId = request?.user?.id;

    if (!userId) {
      throw new UnauthorizedError('User not found');
    }

    const csvData = request.csvData;

    if (!csvData || !csvData.subscriptions || csvData.subscriptions.length === 0) {
      throw new BadRequestError('No valid subscription data found in CSV');
    }

    const subscriptions = csvData.subscriptions;
    const bulkCreateSubscriptionInput: BulkCreateSubscriptionInput[] = subscriptions.map(
      (subscription) => ({
        userId,
        ...subscription,
      })
    );
    logger.debug({ count: subscriptions.length, userId }, 'Processing bulk create');

    const result = await this.bulkCreateUseCase.run(bulkCreateSubscriptionInput);

    return reply.status(201).send({
      success: result.success,
      failed: result.failed,
      total: subscriptions.length,
      createdIds: result.createdIds,
      errors: result.errors,
    });
  }
}
