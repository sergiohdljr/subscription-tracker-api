export interface SubscriptionNotificationService {
    notifyRenewal(data: {
        userId: string
        email: string
        subscriptionsName: string[]
        nextBillingDate: Date
    }): Promise<void>
}
