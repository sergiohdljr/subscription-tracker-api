import type { SubscriptionNotificationService } from '@/modules/subscriptions/application/services/subscription-notification-service';
import type { ResendConfigAdapter } from '../../email/resend';
import { createContextLogger } from '../../logging/logger';

const logger = createContextLogger('resend-subscription-notification');

export class ResendSubscriptionNotificationAdapter implements SubscriptionNotificationService {
  constructor(readonly resend: ResendConfigAdapter) { }

  async notifyRenewal(data: {
    email: string;
    subscriptionsName: string[];
    nextBillingDate: Date;
  }) {
    const today = new Date();
    const nextBilling = new Date(data.nextBillingDate);
    const diffTime = nextBilling.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const subscriptionsList = data.subscriptionsName
      .map((name, index) => `${index + 1}. ${name}`)
      .join('<br>');

    let renewalMessage = '';
    if (diffDays === 0) {
      renewalMessage = 'suas assinaturas vencem hoje';
    } else if (diffDays === 1) {
      renewalMessage = 'suas assinaturas vencem em 1 dia';
    } else {
      renewalMessage = `suas assinaturas vencem em ${diffDays} dias`;
    }

    // Format date
    const formattedDate = nextBilling.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });


    const subject =
      data.subscriptionsName.length === 1
        ? `Lembrete: ${data.subscriptionsName[0]} vence em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`
        : `Lembrete: ${data.subscriptionsName.length} assinaturas vencem em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;

    const sendEmail = await this.resend.sendEmail(data.email, subject, process.env.RESEND_SUBSCRIPTION_RENEW_TEMPLATE ?? '', {
      RENEWAL_MESSAGE: renewalMessage,
      SUBSCRIPTIONS_LIST: subscriptionsList,
      FORMATTED_DATE: formattedDate,
    });

    if (sendEmail.error) {
      logger.error(
        {
          err: sendEmail.error,
          email: data.email,
        },
        'Failed to send subscription renewal email'
      );
    } else {
      logger.info(
        {
          email: data.email,
          subscriptionsCount: data.subscriptionsName.length,
        },
        'Subscription renewal email sent successfully'
      );
    }
  }
}
