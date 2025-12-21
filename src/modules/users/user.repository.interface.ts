import { User } from "./user.schema"

export interface UserRepositoryInterface {
  findById(userId: string): Promise<User | null>
}

