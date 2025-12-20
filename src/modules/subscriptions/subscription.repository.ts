import { and, eq, gt } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { subscriptions } from "../../db/schema";
import type * as schema from "../../db/schema";
import { SubscriptionRepositoryInterface } from "./subscription.repository.interface";
import { CreateSubscription, Subscription, UpdateSubscription } from "./subscription.schema";



export class SubscriptionDrizzleRepository implements SubscriptionRepositoryInterface {
  constructor(private readonly db: NodePgDatabase<typeof schema>) { }

  async create(subscription: CreateSubscription): Promise<Record<string, number>> {
    const [result] = await this.db.insert(subscriptions).values(subscription).returning({
      id: subscriptions.id,
    })

    return result
  }

  async update(id: number, subscription: UpdateSubscription): Promise<Subscription> {
    const [result] = await this.db.update(subscriptions).set(subscription).where(eq(subscriptions.id, id)).returning()
    return result
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(subscriptions).where(eq(subscriptions.id, id))
  }

  async findById(id: number): Promise<Subscription | null> {
    const result = await this.db.select().from(subscriptions).where(eq(subscriptions.id, id))
    return result[0]
  }

  async findAll(): Promise<Subscription[]> {
    const result = await this.db.select().from(subscriptions)
    return result
  }

  async findExpiringSoon(daysBeforeExpiration: number = 15, userId: string): Promise<Subscription[]> {
    const now = new Date()
    const expirationDate = new Date(now.getTime() + daysBeforeExpiration * 24 * 60 * 60 * 1000)
    const result = await this.db.select()
      .from(subscriptions)
      .where(and(gt(subscriptions.nextBillingDate, expirationDate), eq(subscriptions.active, true), eq(subscriptions.userId, userId)))
    return result
  }
}