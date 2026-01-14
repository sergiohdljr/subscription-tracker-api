import { Subscription } from "../../domain/entity/subscription";

export interface SubscriptionRepository {
    save(subscription: Subscription): Promise<Record<string, number>>;
    findById(id: number, userId: string): Promise<Subscription | null>;
    findByUserId(userId: string): Promise<Subscription[]>;
    findActiveByUserId(userId: string): Promise<Subscription[]>;
    findSubscriptionsToNotify(daysBefore: number, today: Date): Promise<Subscription[]>;
    update(subscription: Subscription): Promise<Subscription>;
}
