import { CreateSubscription, Subscription, UpdateSubscription } from "./subscription.schema"

export interface SubscriptionRepositoryInterface {
  create(subscription: CreateSubscription): Promise<Record<string, number>>
  update(id: number, subscription: UpdateSubscription): Promise<Subscription>
  delete(id: number): Promise<void>
  findById(id: number): Promise<Subscription | null>
  findAll(): Promise<Subscription[]>
}