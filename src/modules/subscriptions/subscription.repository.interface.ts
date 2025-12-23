import { CreateSubscription, Subscription, UpdateSubscription } from "./subscription.schema"

export interface SubscriptionRepositoryInterface {
  create(subscription: CreateSubscription): Promise<Record<string, number>>
  update(id: string, subscription: UpdateSubscription): Promise<Subscription>
  delete(id: string): Promise<void>
  findById(id: string): Promise<Subscription | null>
  findAll(id: string): Promise<Subscription[]>
  findExpiringSoon(daysBeforeExpiration: number, userId: string): Promise<Subscription[]>
}