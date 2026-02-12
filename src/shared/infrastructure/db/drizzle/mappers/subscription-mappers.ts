import {
  type Currency,
  Subscription,
} from '@/modules/subscriptions/domain/entity/subscription';
import type { subscriptions as SubscriptionsQuery } from '../schemas';
import { Money } from '@/modules/subscriptions/domain/value-objects/money';
import { BillingCycle } from '@/modules/subscriptions/domain/value-objects/billing-cycle';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

type SubscriptionQuery = InferSelectModel<typeof SubscriptionsQuery>;
type SubscriptionInsertPersistence = InferInsertModel<typeof SubscriptionsQuery>;

// biome-ignore lint/complexity/noStaticOnlyClass: Mapper utility class with static methods
export class SubscriptionMapper {
  static toDomain(row: SubscriptionQuery): Subscription {
    return new Subscription(
      row.id,
      row.userId,
      row.name,
      new Money(Number(row.price), row.currency as Currency),
      row.currency as Currency,
      new BillingCycle(row.billingCycle),
      row.status,
      row.startDate,
      row.nextBillingDate,
      row.lastBillingDate,
      row.renewalNotifiedAt,
      row.trialEndsAt,
      row.createdAt,
      row.updatedAt
    );
  }

  static toInsert(subscription: Subscription): SubscriptionInsertPersistence {
    return {
      userId: subscription.userId,
      name: subscription.name,
      price: subscription.price.amount.toFixed(2),
      currency: subscription.price.currency,
      billingCycle: subscription.billingCycle.getValue(),
      status: subscription.status,
      startDate: subscription.startDate,
      nextBillingDate: subscription.nextBillingDate,
      lastBillingDate: subscription.lastBillingDate,
      renewalNotifiedAt: subscription.renewalNotifiedAt,
      trialEndsAt: subscription.trialEndsAt,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}
