import type { Subscription } from '@/modules/subscriptions/domain/entity/subscription';
import type { SubscriptionRepository } from '../../repositories/subscriptions-repository';
import type { UserRepositoryInterface } from '@/modules/user/domain/repositories/user-repository';
import type { SubscriptionNotificationService } from '../../services/subscription-notification-service';
import { createContextLogger } from '@/shared/infrastructure/logging/logger';

const logger = createContextLogger('notify-subscriptions-usecase');

export class NotifySubscriptionsUseCase {
  constructor(
    private readonly subscriptionsRepository: SubscriptionRepository,
    private readonly userRepository: UserRepositoryInterface,
    private readonly notificationService: SubscriptionNotificationService
  ) {}

  async run(daysBefore: number = 10, today: Date = new Date()) {
    logger.info(
      { daysBefore, date: today.toISOString() },
      'Starting subscription notifications processing'
    );

    try {
      const subscriptions =
        await this.subscriptionsRepository.findSubscriptionsToNotify(daysBefore);

      logger.info(
        { daysBefore, date: today.toISOString(), count: subscriptions.length },
        'Found subscriptions to check for notification'
      );

      if (subscriptions.length === 0) {
        logger.info({ daysBefore, date: today.toISOString() }, 'No subscriptions found to notify');
        return;
      }

      const subscriptionsToNotify = subscriptions.filter((sub) =>
        sub.shouldNotify(daysBefore, today)
      );

      logger.debug(
        {
          daysBefore,
          date: today.toISOString(),
          totalFound: subscriptions.length,
          eligibleCount: subscriptionsToNotify.length,
        },
        'Filtered subscriptions eligible for notification'
      );

      if (subscriptionsToNotify.length === 0) {
        logger.info(
          { daysBefore, date: today.toISOString() },
          'No subscriptions eligible for notification after filtering'
        );
        return;
      }

      const subscriptionsByUser = new Map<string, Subscription[]>();
      for (const subscription of subscriptionsToNotify) {
        const userSubscriptions = subscriptionsByUser.get(subscription.userId) || [];
        userSubscriptions.push(subscription);
        subscriptionsByUser.set(subscription.userId, userSubscriptions);
      }

      logger.debug(
        {
          daysBefore,
          date: today.toISOString(),
          uniqueUsers: subscriptionsByUser.size,
          totalSubscriptions: subscriptionsToNotify.length,
        },
        'Grouped subscriptions by user'
      );

      const updatedSubscriptions: Subscription[] = [];
      let notificationsSent = 0;
      let usersSkipped = 0;

      for (const [userId, userSubscriptions] of subscriptionsByUser.entries()) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
          logger.warn(
            {
              userId,
              subscriptionsCount: userSubscriptions.length,
              daysBefore,
              date: today.toISOString(),
            },
            'User not found, skipping notification'
          );
          usersSkipped++;
          continue;
        }

        const subscriptionsName = userSubscriptions.map((sub) => sub.name);
        const nextBillingDate = userSubscriptions[0].nextBillingDate;

        logger.debug(
          {
            userId,
            email: user.email,
            subscriptionsCount: userSubscriptions.length,
            subscriptionsName,
            nextBillingDate: nextBillingDate.toISOString(),
            daysBefore,
            date: today.toISOString(),
          },
          'Sending notification to user'
        );

        await this.notificationService.notifyRenewal({
          email: user.email,
          subscriptionsName,
          nextBillingDate,
        });

        notificationsSent++;

        for (const subscription of userSubscriptions) {
          subscription.renewalNotifiedAt = today;
          updatedSubscriptions.push(subscription);
        }

        logger.debug(
          {
            userId,
            email: user.email,
            subscriptionsCount: userSubscriptions.length,
            date: today.toISOString(),
          },
          'Notification sent successfully, marking subscriptions as notified'
        );
      }

      if (updatedSubscriptions.length > 0) {
        await this.subscriptionsRepository.updateMany(updatedSubscriptions);
      }

      logger.info(
        { daysBefore, date: today.toISOString(), notificationsSent, usersSkipped },
        'Subscription notifications processed successfully'
      );
    } catch (error) {
      logger.error({ error }, 'Error processing subscription notifications');
      throw new Error('Error processing subscription notifications', { cause: error });
    }
  }
}
