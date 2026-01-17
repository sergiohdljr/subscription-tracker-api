import { SubscriptionNotificationService } from "@/modules/subscriptions/application/services/subscription-notification-service";
import { resendConfig } from "../../email/resend";

export class ResendSubscriptionNotificationAdapter
    implements SubscriptionNotificationService {

    async notifyRenewal(data: {
        userId: string
        email: string
        subscriptionsName: string[]
        nextBillingDate: Date
    }) {

        const sendEmail = await resendConfig.getInstance().emails.send({
            from: 'sergio <sergio.tjf1@gmail.com>',
            to: [data.email],
            subject: 'Hello World',
            html: '<strong>It works!</strong>'
        })

        if (sendEmail.error) {
            console.error(sendEmail.error)
        }

    }
}
