import { UserRepositoryInterface } from "../../users/user.repository.interface";
import { SubscriptionRepositoryInterface } from "../subscription.repository.interface";

export class FindAllSubscriptionsUseCase {
    constructor(private readonly subscriptionRepository: SubscriptionRepositoryInterface, private readonly userRepository: UserRepositoryInterface) {
    }

    async run(userId: string) {
        const user = await this.userRepository.findById(userId)

        if (!user) {
            throw new Error("User not found")
        }

        return await this.subscriptionRepository.findAll(userId)

    }
}