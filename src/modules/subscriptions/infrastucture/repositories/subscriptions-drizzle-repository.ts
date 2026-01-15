import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { SubscriptionRepository } from "../../application/repositories/subscriptions-repository";
import { Subscription } from "../../domain/entity/subscription";
import type * as schema from "../../../../shared/infrastructure/db/drizzle/schemas/schema"
import { subscriptions as subscriptionsSchema } from "../../../../shared/infrastructure/db/drizzle/schemas"
import { and, eq, gte, sql } from "drizzle-orm";
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
    async findByUserId(userId: string): Promise<Subscription[]> {

        const rows = await this.drizzleConnection.select()
            .from(subscriptionsSchema)
            .where(eq(subscriptionsSchema.userId, userId))

        return rows.map(SubscriptionMapper.toDomain)

    }

    async update(subscription: Subscription, userId: string): Promise<Subscription> {

        const data = SubscriptionMapper.toInsert(subscription)

        const [row] = await this.drizzleConnection
            .update(subscriptionsSchema)
            .set(data)
            .where(and(eq(subscriptionsSchema.id, subscription.id), eq(subscriptionsSchema.userId, userId)))
            .returning({
                subscriptionsSchema
            })


        return SubscriptionMapper.toDomain(row.subscriptionsSchema)
    }

    async findSubscriptionsToNotify(daysBefore: number = 7): Promise<Subscription[]> {

        const rows = await this.drizzleConnection
            .select()
            .from(subscriptionsSchema)
            .where(
                and(
                    eq(subscriptionsSchema.status, "ACTIVE"),
                    eq(
                        subscriptionsSchema.startDate,
                        sql`CURRENT_DATE + INTERVAL '${daysBefore} days'`
                    )
                ))

        return rows.map(SubscriptionMapper.toDomain)

    }

}