export interface SubscriptionNotificationService {
  notifyRenewal(data: {
    email: string;
    subscriptionsName: string[];
    nextBillingDate: Date;
  }): Promise<void>;
}
