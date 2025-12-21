import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { user } from "../../db/schema";
import type * as schema from "../../db/schema";
import { UserRepositoryInterface } from "./user.repository.interface";
import { User } from "./user.schema";

export class UserDrizzleRepository implements UserRepositoryInterface {
  constructor(private readonly db: NodePgDatabase<typeof schema>) { }

  async findById(userId: string): Promise<User | null> {
    const [result] = await this.db.select().from(user).where(eq(user.id, userId))
    return result
  }
}

