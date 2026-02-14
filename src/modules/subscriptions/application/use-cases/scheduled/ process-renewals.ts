import type { Subscription } from '@/modules/subscriptions/domain/entity/subscription';
import type { SubscriptionRepository } from '../../repositories/subscriptions-repository';

export class ProcessRenewalsUseCase {
  constructor(private readonly subscriptionsRepository: SubscriptionRepository) {}

  async run(today: Date = new Date()) {
    const updated: Subscription[] = [];

    const subscriptionsToRenew = await this.subscriptionsRepository.findDueForRenewal(today);

    for (const subscription of subscriptionsToRenew) {
      if (subscription.isTrial()) {
        if (subscription.canActivateFromTrial(today)) {
          subscription.activateFromTrial(today);
          updated.push(subscription);
        }
        continue;
      }

      if (subscription.isActive()) {
        subscription.renew();
        updated.push(subscription);
      }
    }

    // persistir todas subscriptions com um metodo bulk edit como uma transação
    await this.subscriptionsRepository.updateMany(updated);
  }
}
