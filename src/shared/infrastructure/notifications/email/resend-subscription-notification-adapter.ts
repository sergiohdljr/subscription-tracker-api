import type { SubscriptionNotificationService } from '@/modules/subscriptions/application/services/subscription-notification-service';
import { resendAdapter } from '../../email/resend';
import { RenewalNotificationFormatter } from '@/modules/subscriptions/application/services/renewal-notification-formatter';
import { createContextLogger } from '../../logging/logger';

const logger = createContextLogger('resend-subscription-notification');

export class ResendSubscriptionNotificationAdapter implements SubscriptionNotificationService {
  private readonly formatter = new RenewalNotificationFormatter();

  constructor(readonly resend: typeof resendAdapter) {}

  async notifyRenewal(data: { email: string; subscriptionsName: string[]; nextBillingDate: Date }) {
    const formatted = this.formatter.format({
      subscriptionsName: data.subscriptionsName,
      nextBillingDate: data.nextBillingDate,
    });

    logger.debug(
      {
        email: data.email,
        subject: formatted.subject,
        templateId: process.env.RESEND_SUBSCRIPTION_RENEW_TEMPLATE ?? '',
        data: {
          RENEWAL_MESSAGE: formatted.renewalMessage,
          SUBSCRIPTIONS_LIST: formatted.subscriptionsList,
          FORMATTED_DATE: formatted.formattedDate,
        },
      },
      'Subscription renewal email data'
    );

    const sendEmail = await this.resend.sendEmail(
      data.email,
      formatted.subject,
      process.env.RESEND_SUBSCRIPTION_RENEW_TEMPLATE ?? '',
      {
        RENEWAL_MESSAGE: formatted.renewalMessage,
        SUBSCRIPTIONS_LIST: formatted.subscriptionsList,
        FORMATTED_DATE: formatted.formattedDate,
      }
    );

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
