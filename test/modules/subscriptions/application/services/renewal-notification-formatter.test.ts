import { RenewalNotificationFormatter } from '@/modules/subscriptions/application/services/renewal-notification-formatter';

describe('RenewalNotificationFormatter', () => {
  let formatter: RenewalNotificationFormatter;

  beforeEach(() => {
    formatter = new RenewalNotificationFormatter();
  });

  describe('format', () => {
    describe('renewal message formatting', () => {
      it('should format message for today (0 days)', () => {
        const today = new Date('2024-02-15T12:00:00.000Z');

        const result = formatter.format({
          subscriptionsName: ['Netflix'],
          nextBillingDate: today,
          referenceDate: today,
        });

        expect(result.renewalMessage).toBe('suas assinaturas vencem hoje');
      });

      it('should format message for 1 day', () => {
        const today = new Date('2024-02-15T12:00:00.000Z');
        const tomorrow = new Date('2024-02-16T12:00:00.000Z');

        const result = formatter.format({
          subscriptionsName: ['Netflix'],
          nextBillingDate: tomorrow,
          referenceDate: today,
        });

        expect(result.renewalMessage).toBe('suas assinaturas vencem em 1 dia');
      });

      it('should format message for multiple days', () => {
        const today = new Date('2024-02-15T12:00:00.000Z');
        const in3Days = new Date('2024-02-18T12:00:00.000Z');

        const result = formatter.format({
          subscriptionsName: ['Netflix'],
          nextBillingDate: in3Days,
          referenceDate: today,
        });

        expect(result.renewalMessage).toBe('suas assinaturas vencem em 3 dias');
      });

      it('should use current date as reference when not provided', () => {
        jest.useFakeTimers();
        const fixedDate = new Date('2024-02-15T12:00:00.000Z');
        jest.setSystemTime(fixedDate);

        const result = formatter.format({
          subscriptionsName: ['Netflix'],
          nextBillingDate: fixedDate,
        });

        expect(result.renewalMessage).toBe('suas assinaturas vencem hoje');

        jest.useRealTimers();
      });
    });

    describe('subscriptions list formatting', () => {
      it('should format single subscription', () => {
        const today = new Date('2024-02-15T12:00:00.000Z');

        const result = formatter.format({
          subscriptionsName: ['Netflix'],
          nextBillingDate: today,
          referenceDate: today,
        });

        expect(result.subscriptionsList).toBe('1. Netflix');
      });

      it('should format multiple subscriptions', () => {
        const today = new Date('2024-02-15T12:00:00.000Z');

        const result = formatter.format({
          subscriptionsName: ['Netflix', 'Spotify', 'Disney+'],
          nextBillingDate: today,
          referenceDate: today,
        });

        expect(result.subscriptionsList).toBe('1. Netflix<br>2. Spotify<br>3. Disney+');
      });

      it('should handle empty subscriptions list', () => {
        const today = new Date('2024-02-15T12:00:00.000Z');

        const result = formatter.format({
          subscriptionsName: [],
          nextBillingDate: today,
          referenceDate: today,
        });

        expect(result.subscriptionsList).toBe('');
      });
    });

    describe('date formatting', () => {
      it('should format date in pt-BR locale', () => {
        const today = new Date('2024-02-15T12:00:00.000Z');
        const nextBilling = new Date('2024-03-20T12:00:00.000Z');

        const result = formatter.format({
          subscriptionsName: ['Netflix'],
          nextBillingDate: nextBilling,
          referenceDate: today,
        });

        expect(result.formattedDate).toBe('20/03/2024');
      });

      it('should format date with leading zeros', () => {
        const today = new Date('2024-02-15T12:00:00.000Z');
        const nextBilling = new Date('2024-01-05T12:00:00.000Z');

        const result = formatter.format({
          subscriptionsName: ['Netflix'],
          nextBillingDate: nextBilling,
          referenceDate: today,
        });

        expect(result.formattedDate).toBe('05/01/2024');
      });
    });

    describe('subject line generation', () => {
      it('should generate subject for single subscription with 1 day', () => {
        const today = new Date('2024-02-15T12:00:00.000Z');
        const tomorrow = new Date('2024-02-16T12:00:00.000Z');

        const result = formatter.format({
          subscriptionsName: ['Netflix'],
          nextBillingDate: tomorrow,
          referenceDate: today,
        });

        expect(result.subject).toBe('Lembrete: Netflix vence em 1 dia');
      });

      it('should generate subject for single subscription with multiple days', () => {
        const today = new Date('2024-02-15T12:00:00.000Z');
        const in5Days = new Date('2024-02-20T12:00:00.000Z');

        const result = formatter.format({
          subscriptionsName: ['Netflix'],
          nextBillingDate: in5Days,
          referenceDate: today,
        });

        expect(result.subject).toBe('Lembrete: Netflix vence em 5 dias');
      });

      it('should generate subject for multiple subscriptions with 1 day', () => {
        const today = new Date('2024-02-15T12:00:00.000Z');
        const tomorrow = new Date('2024-02-16T12:00:00.000Z');

        const result = formatter.format({
          subscriptionsName: ['Netflix', 'Spotify'],
          nextBillingDate: tomorrow,
          referenceDate: today,
        });

        expect(result.subject).toBe('Lembrete: 2 assinaturas vencem em 1 dia');
      });

      it('should generate subject for multiple subscriptions with multiple days', () => {
        const today = new Date('2024-02-15T12:00:00.000Z');
        const in7Days = new Date('2024-02-22T12:00:00.000Z');

        const result = formatter.format({
          subscriptionsName: ['Netflix', 'Spotify', 'Disney+'],
          nextBillingDate: in7Days,
          referenceDate: today,
        });

        expect(result.subject).toBe('Lembrete: 3 assinaturas vencem em 7 dias');
      });

      it('should use singular "dia" for 1 day and plural "dias" for multiple days', () => {
        const today = new Date('2024-02-15T12:00:00.000Z');
        const tomorrow = new Date('2024-02-16T12:00:00.000Z');
        const in3Days = new Date('2024-02-18T12:00:00.000Z');

        const result1 = formatter.format({
          subscriptionsName: ['Netflix'],
          nextBillingDate: tomorrow,
          referenceDate: today,
        });

        const result2 = formatter.format({
          subscriptionsName: ['Netflix'],
          nextBillingDate: in3Days,
          referenceDate: today,
        });

        expect(result1.subject).toContain('1 dia');
        expect(result2.subject).toContain('3 dias');
      });
    });

    describe('complete format output', () => {
      it('should return all formatted fields correctly', () => {
        const today = new Date('2024-02-15T12:00:00.000Z');
        const in7Days = new Date('2024-02-22T12:00:00.000Z');

        const result = formatter.format({
          subscriptionsName: ['Netflix', 'Spotify'],
          nextBillingDate: in7Days,
          referenceDate: today,
        });

        expect(result).toEqual({
          renewalMessage: 'suas assinaturas vencem em 7 dias',
          subscriptionsList: '1. Netflix<br>2. Spotify',
          formattedDate: '22/02/2024',
          subject: 'Lembrete: 2 assinaturas vencem em 7 dias',
        });
      });
    });
  });
});
