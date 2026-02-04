import { Subscription } from "@/modules/subscriptions/domain/entity/subscription";
import { SubscriptionRepository } from "../../repositories/subscriptions-repository";
import { UserRepositoryInterface } from "@/modules/user/domain/repositories/user-repository";
import { SubscriptionNotificationService } from "../../services/subscription-notification-service";

export class NotifySubscriptionsUseCase {
    constructor(
        private readonly subscriptionsRepository: SubscriptionRepository,
        private readonly userRepository: UserRepositoryInterface,
        private readonly notificationService: SubscriptionNotificationService,
    ) { }

    async run(daysBefore: number = 10, today: Date = new Date()) {
        const subscriptions = await this.subscriptionsRepository.findSubscriptionsToNotify(daysBefore);

        if (subscriptions.length === 0) {
            return;
        }

        // Filter subscriptions that should be notified using the domain method
        const subscriptionsToNotify = subscriptions.filter(sub =>
            sub.shouldNotify(daysBefore, today)
        );

        if (subscriptionsToNotify.length === 0) {
            return;
        }

        // Group subscriptions by userId
        const subscriptionsByUser = new Map<string, Subscription[]>();
        for (const subscription of subscriptionsToNotify) {
            const userSubscriptions = subscriptionsByUser.get(subscription.userId) || [];
            userSubscriptions.push(subscription);
            subscriptionsByUser.set(subscription.userId, userSubscriptions);
        }

        const updatedSubscriptions: Subscription[] = [];

        // Process each user's subscriptions
        for (const [userId, userSubscriptions] of subscriptionsByUser.entries()) {
            const user = await this.userRepository.findById(userId);

            if (!user) {
                // Skip if user does not exist
                continue;
            }

            // Get subscription names and next billing date (should be the same for all)
            const subscriptionsName = userSubscriptions.map(sub => sub.name);
            const nextBillingDate = userSubscriptions[0].nextBillingDate;

            // Send notification
            await this.notificationService.notifyRenewal({
                userId: user.id,
                email: user.email,
                subscriptionsName,
                nextBillingDate,
            });

            // Mark subscriptions as notified
            for (const subscription of userSubscriptions) {
                subscription.renewalNotifiedAt = today;
                updatedSubscriptions.push(subscription);
            }
        }

        // Update all subscriptions that were notified
        if (updatedSubscriptions.length > 0) {
            await this.subscriptionsRepository.updateMany(updatedSubscriptions);
        }
    }
}

