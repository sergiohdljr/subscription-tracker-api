import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { SubscriptionRepository } from "../../application/repositories/subscriptions-repository";
import { Subscription } from "../../domain/entity/subscription";
import type * as schema from "../../../../shared/infrastructure/db/drizzle/schemas/schema"
import { subscriptions as subscriptionsSchema } from "../../../../shared/infrastructure/db/drizzle/schemas"
import { and, eq } from "drizzle-orm";
import { SubscriptionMapper } from "@/shared/infrastructure/db/drizzle/mappers/subscription-mappers";

export class SubscriptionsDrizzleRepository implements SubscriptionRepository {

    constructor(public readonly drizzleConnection: NodePgDatabase<typeof schema>) { }

    async save(subscription: Subscription): Promise<Record<string, number>> {
        const data = SubscriptionMapper.toInsert(subscription)

        const [returningData] = await this.drizzleConnection.insert(subscriptionsSchema).values(data).returning({
            id: subscriptionsSchema.id
        })
        return returningData
    }

    async findById(id: number, userId: string): Promise<Subscription | null> {

        const [query] = await this.drizzleConnection.select()
            .from(subscriptionsSchema)
            .where(and(eq(subscriptionsSchema.id, id), eq(subscriptionsSchema.userId, userId)))

        if (!query) {
            return null
        }

        return SubscriptionMapper.toDomain(query)
    }

    async findActiveByUserId(userId: string): Promise<Subscription[]> { }
    async findByUserId(userId: string): Promise<Subscription[]> { }
    async findSubscriptionsToNotify(daysBefore: number, today: Date): Promise<Subscription[]> { }

    async update(subscription: Subscription): Promise<void> { }
}