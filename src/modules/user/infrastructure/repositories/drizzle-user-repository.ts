import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { User } from "../../domain/entities/User";
import type { UserRepositoryInterface } from "../../domain/repositories/user-repository";
import { user } from '@/shared/infrastructure/db/drizzle/schemas/schema'
import type * as schema from '@/shared/infrastructure/db/drizzle/schemas/schema'
import { eq } from "drizzle-orm";

export class drizzleUserRepository implements UserRepositoryInterface {
    constructor(private readonly db: NodePgDatabase<typeof schema>) { }

    async findById(userId: string): Promise<User | null> {
        const [data] = await this.db.select().from(user).where(eq(user.id, userId))
        return new User(
            data.id,
            data.name,
            data.email
        )
    }
}