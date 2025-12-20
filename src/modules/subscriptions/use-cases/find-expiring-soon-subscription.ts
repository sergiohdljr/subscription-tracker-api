import { SubscriptionRepositoryInterface } from "../subscription.repository.interface";
import { Subscription } from "../subscription.schema";
import { UserRepositoryInterface } from "../../users/user.repository.interface";


export class FindExpiringSoonSubscriptionUseCase {
    constructor(private readonly subscriptionRepository: SubscriptionRepositoryInterface, private readonly userRepository: UserRepositoryInterface) {
    }

    async execute(daysBeforeExpiration: number, userId: string): Promise<Subscription[]> {

        if (!userId) {
            throw new Error('User ID is required')
        }
        if (!daysBeforeExpiration) {
            throw new Error('Days before expiration is required')
        }
        if (daysBeforeExpiration < 0) {
            throw new Error('Days before expiration must be greater than 0')
        }

        const user = await this.userRepository.findById(userId)
        if (!user) {
            throw new Error('User not found')
        }


        return this.subscriptionRepository.findExpiringSoon(daysBeforeExpiration, userId)
    }
}