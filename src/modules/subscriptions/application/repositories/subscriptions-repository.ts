import type { Subscription } from '../../domain/entity/subscription';

export interface SubscriptionRepository {
  save(subscription: Subscription): Promise<Record<string, number>>;
  saveMany(subscriptions: Subscription[]): Promise<Array<Record<string, number>>>;
  updateMany(subscriptions: Subscription[]): Promise<void>;
  findById(id: number, userId: string): Promise<Subscription | null>;
  findByUserId(userId: string): Promise<Subscription[]>;
  findSubscriptionsToNotify(daysBefore: number): Promise<Subscription[]>;
  update(subscription: Subscription, userId: string): Promise<Subscription>;
  findDueForRenewal(referenceDate: Date): Promise<Subscription[]>;
}
