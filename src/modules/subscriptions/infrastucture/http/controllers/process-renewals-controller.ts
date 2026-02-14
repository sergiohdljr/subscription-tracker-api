import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ProcessRenewalsUseCase } from '@/modules/subscriptions/application/use-cases/scheduled/ process-renewals';
import { createContextLogger } from '@/shared/infrastructure/logging/logger';

const logger = createContextLogger('process-renewals-controller');

export class ProcessRenewalsController {
  constructor(private readonly processRenewalsUseCase: ProcessRenewalsUseCase) {}

  async handle(_request: FastifyRequest, reply: FastifyReply) {
    const today = new Date();

    logger.info({ date: today.toISOString() }, 'Processing renewals');

    await this.processRenewalsUseCase.run(today);

    logger.info({ date: today.toISOString() }, 'Renewals processed successfully');

    return reply.status(200).send({
      message: 'Renewals processed successfully',
      date: today.toISOString(),
    });
  }
}
