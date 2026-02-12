import type { UserRepositoryInterface } from '@/modules/user/domain/repositories/user-repository';
import type { SubscriptionRepository } from '../repositories/subscriptions-repository';
import type { subscriptions } from '../../../../shared/infrastructure/db/drizzle/schemas/schema';
import type { InferInsertModel } from 'drizzle-orm';
import { type Currency, Money } from '../../domain/value-objects/money';
import { Subscription, type SubscriptionStatus } from '../../domain/entity/subscription';
import { BillingCycle } from '../../domain/value-objects/billing-cycle';
import { UserNotFoundError } from '../errors/user-not-found-errors';
import { InvalidSubscriptionNameError } from '../../domain/errors/invalid-subscription-name';
import { InvalidTrialPeriodError } from '../../domain/errors/invalid-trial-period';
import { InvalidBillingDateError } from '../../domain/errors/invalid-billing-date';

export class CreateSubscriptionUseCase {
  constructor(
    private readonly subscriptionsRepository: SubscriptionRepository,
    private readonly userRepository: UserRepositoryInterface
  ) {}

  async run(input: InferInsertModel<typeof subscriptions>) {
    const user = this.userRepository.findById(input.userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    const price = new Money(Number(input.price), input.currency as Currency);
    const billingCycle = new BillingCycle(input.billingCycle);
    const status: SubscriptionStatus = input.trialEndsAt ? 'TRIAL' : 'ACTIVE';

    if (!input.name || input.name.trim().length === 0) {
      throw new InvalidSubscriptionNameError();
    }

    if (input.trialEndsAt) {
      if (input.trialEndsAt < input.startDate) throw new InvalidTrialPeriodError();
    }

    const subscription = new Subscription(
      1, // placeholder for id
      input.userId,
      input.name,
      price,
      price.currency,
      billingCycle,
      status,
      input.startDate,
      input.nextBillingDate,
      null, // lastBillingDate
      null,
      input.trialEndsAt ?? null,
      new Date(),
      new Date()
    );

    subscription.initialize();

    return await this.subscriptionsRepository.save(subscription);
  }
}
