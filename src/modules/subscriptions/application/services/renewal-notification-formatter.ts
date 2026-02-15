export interface RenewalNotificationData {
  subscriptionsName: string[];
  nextBillingDate: Date;
  referenceDate?: Date; // Para testabilidade
}

export interface FormattedRenewalNotification {
  renewalMessage: string;
  subscriptionsList: string;
  formattedDate: string;
  subject: string;
}

export class RenewalNotificationFormatter {
  format(data: RenewalNotificationData): FormattedRenewalNotification {
    const referenceDate = data.referenceDate ?? new Date();
    const nextBilling = new Date(data.nextBillingDate);
    const diffDays = this.calculateDaysUntilRenewal(referenceDate, nextBilling);

    return {
      renewalMessage: this.formatRenewalMessage(diffDays),
      subscriptionsList: this.formatSubscriptionsList(data.subscriptionsName),
      formattedDate: this.formatDate(nextBilling),
      subject: this.formatSubject(data.subscriptionsName, diffDays),
    };
  }

  private calculateDaysUntilRenewal(from: Date, to: Date): number {
    const diffTime = to.getTime() - from.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private formatRenewalMessage(diffDays: number): string {
    if (diffDays === 0) {
      return 'suas assinaturas vencem hoje';
    }
    if (diffDays === 1) {
      return 'suas assinaturas vencem em 1 dia';
    }
    return `suas assinaturas vencem em ${diffDays} dias`;
  }

  private formatSubscriptionsList(subscriptionsName: string[]): string {
    return subscriptionsName.map((name, index) => `${index + 1}. ${name}`).join('<br>');
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private formatSubject(subscriptionsName: string[], diffDays: number): string {
    const daysText = diffDays === 1 ? 'dia' : 'dias';

    if (subscriptionsName.length === 1) {
      return `Lembrete: ${subscriptionsName[0]} vence em ${diffDays} ${daysText}`;
    }

    return `Lembrete: ${subscriptionsName.length} assinaturas vencem em ${diffDays} ${daysText}`;
  }
}
