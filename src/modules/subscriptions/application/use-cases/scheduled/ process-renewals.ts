import type { Subscription } from '@/modules/subscriptions/domain/entity/subscription';
import type { SubscriptionRepository } from '../../repositories/subscriptions-repository';
import { getLogger, Logger } from '@/shared/infrastructure/logging/logger';

const logger = getLogger();

export class ProcessRenewalsUseCase {
  constructor(private readonly subscriptionsRepository: SubscriptionRepository) {}

  async run(today: Date = new Date()) {
    logger.info({ date: today.toISOString() }, 'Processing renewals');

    const updated: Subscription[] = [];

    const subscriptionsToRenew = await this.subscriptionsRepository.findDueForRenewal(today);

    logger.debug(
      { subscriptionsToRenew: subscriptionsToRenew.length },
      'Found subscriptions to renew'
    );

    for (const subscription of subscriptionsToRenew) {
      logger.debug({ subscription: subscription.id }, 'Processing subscription');

      if (subscription.isTrial()) {
        if (subscription.canActivateFromTrial(today)) {
          subscription.activateFromTrial(today);
          updated.push(subscription);
          logger.debug({ subscription: subscription.id }, 'Activated from trial');
        }
        continue;
      }

      if (subscription.isActive()) {
        subscription.renew();
        updated.push(subscription);
        logger.debug({ subscription: subscription.id }, 'Renewed subscription');
      }
    }

    // persistir todas subscriptions com um metodo bulk edit como uma transação
    logger.debug({ updated: updated.length }, 'Updating subscriptions');
    await this.subscriptionsRepository.updateMany(updated);
    logger.debug({ updated: updated.length }, 'Updated subscriptions');
  }
}
