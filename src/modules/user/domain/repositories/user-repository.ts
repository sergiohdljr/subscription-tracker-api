import type { User } from '../entities/User';

export interface UserRepositoryInterface {
  findById(userId: string): Promise<User | null>;
}
