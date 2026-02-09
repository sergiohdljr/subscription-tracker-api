import { SubscriptionNotificationService } from "@/modules/subscriptions/application/services/subscription-notification-service";
import { ResendConfig } from "../../email/resend";
import { createContextLogger } from "../../logging/logger";

const logger = createContextLogger('resend-subscription-notification')

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

        // Calculate days until renewal
        const today = new Date()
        const nextBilling = new Date(data.nextBillingDate)
        const diffTime = nextBilling.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // Format subscriptions list
        const subscriptionsList = data.subscriptionsName
            .map((name, index) => `${index + 1}. ${name}`)
            .join('<br>')

        // Format renewal message
        let renewalMessage = ''
        if (diffDays === 0) {
            renewalMessage = 'suas assinaturas vencem hoje'
        } else if (diffDays === 1) {
            renewalMessage = 'suas assinaturas vencem em 1 dia'
        } else {
            renewalMessage = `suas assinaturas vencem em ${diffDays} dias`
        }

        // Format date
        const formattedDate = nextBilling.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        background-color: #4F46E5;
                        color: white;
                        padding: 20px;
                        text-align: center;
                        border-radius: 8px 8px 0 0;
                    }
                    .content {
                        background-color: #f9fafb;
                        padding: 30px;
                        border-radius: 0 0 8px 8px;
                    }
                    .subscriptions-list {
                        background-color: white;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                        border-left: 4px solid #4F46E5;
                    }
                    .warning {
                        background-color: #FEF3C7;
                        border: 1px solid #F59E0B;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        color: #6B7280;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Lembrete de Renovação</h1>
                </div>
                <div class="content">
                    <p>Olá,</p>
                    <p>Este é um lembrete de que ${renewalMessage}.</p>
                    
                    <div class="subscriptions-list">
                        <h3>Assinaturas que serão renovadas:</h3>
                        ${subscriptionsList}
                    </div>

                    <div class="warning">
                        <strong>Data de renovação:</strong> ${formattedDate}
                    </div>

                    <p>Certifique-se de ter fundos disponíveis para a cobrança automática.</p>
                </div>
                <div class="footer">
                    <p>Este é um email automático, por favor não responda.</p>
                </div>
            </body>
            </html>
        `

        const subject = data.subscriptionsName.length === 1
            ? `Lembrete: ${data.subscriptionsName[0]} vence em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`
            : `Lembrete: ${data.subscriptionsName.length} assinaturas vencem em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`

        const sendEmail = await resendInstance.emails.send({
            from: 'sergio <sergio.tjf1@gmail.com>',
            to: [data.email],
            subject,
            html
        })

        if (sendEmail.error) {
            logger.error({ 
                err: sendEmail.error,
                userId: data.userId,
                email: data.email
            }, 'Failed to send subscription renewal email')
        } else {
            logger.info({ 
                userId: data.userId,
                email: data.email,
                subscriptionsCount: data.subscriptionsName.length
            }, 'Subscription renewal email sent successfully')
        }
    }
}
