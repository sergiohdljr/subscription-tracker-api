import type { Subscription } from '@/modules/subscriptions/domain/entity/subscription';
import type { SubscriptionRepository } from '../../repositories/subscriptions-repository';
import { createContextLogger } from '@/shared/infrastructure/logging/logger';

const logger = createContextLogger('process-renewals-usecase');

export class ProcessRenewalsUseCase {
  constructor(private readonly subscriptionsRepository: SubscriptionRepository) { }

  async run(today: Date = new Date()) {
    logger.info({ date: today.toISOString() }, 'Starting subscription renewals processing');

    const updated: Subscription[] = [];

    try {
      const subscriptionsToRenew = await this.subscriptionsRepository.findDueForRenewal(today);

      logger.info(
        { date: today.toISOString(), count: subscriptionsToRenew.length },
        'Found subscriptions due for renewal'
      );

      let activatedFromTrial = 0;
      let renewed = 0;

      for (const subscription of subscriptionsToRenew) {
        if (subscription.isTrial()) {
          if (subscription.canActivateFromTrial(today)) {
            subscription.activateFromTrial(today);
            updated.push(subscription);
            activatedFromTrial++;

            logger.debug(
              {
                subscriptionId: subscription.id,
                userId: subscription.userId,
                date: today.toISOString(),
              },
              'Subscription activated from trial'
            );
          } else {
            logger.debug(
              {
                subscriptionId: subscription.id,
                userId: subscription.userId,
                date: today.toISOString(),
              },
              'Trial subscription cannot be activated yet'
            );
          }
          continue;
        }

        if (subscription.isActive()) {
          subscription.renew();
          updated.push(subscription);
          renewed++;

          logger.debug(
            {
              subscriptionId: subscription.id,
              userId: subscription.userId,
              nextBillingDate: subscription.nextBillingDate.toISOString(),
              date: today.toISOString(),
            },
            'Subscription renewed'
          );
        }
      }

      await this.subscriptionsRepository.updateMany(updated);

      if (updated.length > 0) {
        logger.info(
          {
            date: today.toISOString(),
            totalUpdated: updated.length,
            activatedFromTrial,
            renewed,
          },
          'Subscriptions updated successfully'
        );
      } else {
        logger.info({ date: today.toISOString() }, 'No subscriptions needed updates');
      }

      logger.info(
        { date: today.toISOString(), totalProcessed: subscriptionsToRenew.length },
        'Subscription renewals processing completed'
      );
    } catch (error) {
      logger.error(
        {
          err: error,
          date: today.toISOString(),
          updatedCount: updated.length,
        },
        'Failed to process subscription renewals'
      );
      throw error;
    }
  }
}
