import type { SubscriptionRepository } from '../repositories/subscriptions-repository';
import type { UserRepositoryInterface } from '@/modules/user/domain/repositories/user-repository';
import { Subscription } from '../../domain/entity/subscription';
import { Money, type Currency } from '../../domain/value-objects/money';
import { BillingCycle } from '../../domain/value-objects/billing-cycle';
import { UserNotFoundError } from '../errors/user-not-found-errors';
import { createContextLogger } from '@/shared/infrastructure/logging/logger';

const logger = createContextLogger('bulk-create-subscriptions-usecase');

export interface BulkCreateSubscriptionInput {
  userId: string;
  name: string;
  price: number;
  currency?: Currency;
  billingCycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: Date;
  trialEndsAt?: Date;
}

export interface BulkCreateResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; data: BulkCreateSubscriptionInput }>;
  createdIds: number[];
}

export class BulkCreateSubscriptionsUseCase {
  constructor(
    private readonly subscriptionsRepository: SubscriptionRepository,
    private readonly userRepository: UserRepositoryInterface
  ) { }

  async run(subscriptions: BulkCreateSubscriptionInput[]): Promise<BulkCreateResult> {
    if (subscriptions.length === 0) {
      return {
        success: 0,
        failed: 0,
        errors: [],
        createdIds: [],
      };
    }

    // Validar se o usuário existe (uma vez só)
    const userId = subscriptions[0].userId;
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    // Validar e criar todas as entidades de domínio ANTES de salvar
    const domainSubscriptions: Subscription[] = [];

    for (let i = 0; i < subscriptions.length; i++) {
      const subscription = new Subscription(
        1, // placeholder for id
        subscriptions[i].userId,
        subscriptions[i].name.trim(),
        new Money(subscriptions[i].price, subscriptions[i].currency as Currency),
        subscriptions[i].currency as Currency,
        new BillingCycle(subscriptions[i].billingCycle),
        subscriptions[i].trialEndsAt ? 'TRIAL' : 'ACTIVE',
        subscriptions[i].startDate,
        new Date(0), // placeholder - will be calculated in initialize
        null, // lastBillingDate
        null, // renewalNotifiedAt
        subscriptions[i].trialEndsAt ?? null,
        new Date(),
        new Date()
      );

      subscription.initialize();

      domainSubscriptions.push(subscription);
    }

    const results = await this.subscriptionsRepository.saveMany(domainSubscriptions);
    const createdIds = results.map((r) => r.id);

    logger.info(
      { count: createdIds.length, userId },
      'Bulk create subscriptions completed successfully'
    );

    return {
      success: createdIds.length,
      failed: 0,
      errors: [],
      createdIds,
    };
  }
}
