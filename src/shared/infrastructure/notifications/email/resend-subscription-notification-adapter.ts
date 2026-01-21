import { SubscriptionNotificationService } from "@/modules/subscriptions/application/services/subscription-notification-service";
import { ResendConfig, resendConfig } from "../../email/resend";

export class ResendSubscriptionNotificationAdapter
    implements SubscriptionNotificationService {
    constructor(
        readonly resend: ResendConfig
    ) { }

    async notifyRenewal(data: {
        userId: string
        email: string
        subscriptionsName: string[]
        nextBillingDate: Date
    }) {

        const resendInstance = this.resend.getInstance()

        const sendEmail = await resendInstance.emails.send({
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
