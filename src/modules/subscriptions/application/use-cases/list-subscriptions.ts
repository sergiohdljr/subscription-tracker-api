import { UserRepositoryInterface } from "@/modules/user/domain/repositories/user-repository";
import { SubscriptionRepository } from "../repositories/subscriptions-repository";
import { UserNotFoundError } from "../errors/user-not-found-errors";

export class ListSubscriptionsUseCase {

    constructor(
        private readonly subscriptionsRepository: SubscriptionRepository,
        private readonly userRepository: UserRepositoryInterface
    ) { }

    async run(userId: string) {
        const user = this.userRepository.findById(userId)

        if (!user) {
            throw new UserNotFoundError()
        }

        return await this.subscriptionsRepository.findByUserId(userId)
    }

}