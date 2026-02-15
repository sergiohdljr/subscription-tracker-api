import { ResendSubscriptionNotificationAdapter } from '@/shared/infrastructure/notifications/email/resend-subscription-notification-adapter';
import type { ResendConfigAdapter } from '@/shared/infrastructure/email/resend';
import { ErrorResponse } from 'resend';

function makeResendAdapter(
  overrides?: Partial<ResendConfigAdapter>
): jest.Mocked<ResendConfigAdapter> {
  return {
    sendEmail: jest.fn(),
    ...overrides,
  } as unknown as jest.Mocked<ResendConfigAdapter>;
}

describe('ResendSubscriptionNotificationAdapter', () => {
  let mockResend: jest.Mocked<ResendConfigAdapter>;
  let adapter: ResendSubscriptionNotificationAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    mockResend = makeResendAdapter();
    adapter = new ResendSubscriptionNotificationAdapter(mockResend);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('notifyRenewal', () => {
    it('should format and send email with correct template variables', async () => {
      const today = new Date('2024-02-15T12:00:00.000Z');
      const in7Days = new Date('2024-02-22T12:00:00.000Z');
      jest.setSystemTime(today);

      mockResend.sendEmail.mockResolvedValue({
        data: { id: 'email-id' },
        headers: null,
        error: null,
      });

      await adapter.notifyRenewal({
        email: 'user@example.com',
        subscriptionsName: ['Netflix', 'Spotify'],
        nextBillingDate: in7Days,
      });

      expect(mockResend.sendEmail).toHaveBeenCalledWith(
        'user@example.com',
        'Lembrete: 2 assinaturas vencem em 7 dias',
        process.env.RESEND_SUBSCRIPTION_RENEW_TEMPLATE ?? '',
        {
          RENEWAL_MESSAGE: 'suas assinaturas vencem em 7 dias',
          SUBSCRIPTIONS_LIST: '1. Netflix<br>2. Spotify',
          FORMATTED_DATE: '22/02/2024',
        }
      );
    });

    it('should format single subscription correctly', async () => {
      const today = new Date('2024-02-15T12:00:00.000Z');
      const tomorrow = new Date('2024-02-16T12:00:00.000Z');
      jest.setSystemTime(today);

      mockResend.sendEmail.mockResolvedValue({
        data: { id: 'email-id' },
        headers: null,
        error: null,
      });

      await adapter.notifyRenewal({
        email: 'test@example.com',
        subscriptionsName: ['Netflix'],
        nextBillingDate: tomorrow,
      });

      expect(mockResend.sendEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Lembrete: Netflix vence em 1 dia',
        process.env.RESEND_SUBSCRIPTION_RENEW_TEMPLATE ?? '',
        {
          RENEWAL_MESSAGE: 'suas assinaturas vencem em 1 dia',
          SUBSCRIPTIONS_LIST: '1. Netflix',
          FORMATTED_DATE: '16/02/2024',
        }
      );
    });

    it('should handle renewal today (0 days)', async () => {
      const today = new Date('2024-02-15T12:00:00.000Z');
      jest.setSystemTime(today);

      mockResend.sendEmail.mockResolvedValue({
        data: { id: 'email-id' },
        headers: null,
        error: null,
      });

      await adapter.notifyRenewal({
        email: 'test@example.com',
        subscriptionsName: ['Netflix'],
        nextBillingDate: today,
      });

      expect(mockResend.sendEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Lembrete: Netflix vence em 0 dias',
        process.env.RESEND_SUBSCRIPTION_RENEW_TEMPLATE ?? '',
        {
          RENEWAL_MESSAGE: 'suas assinaturas vencem hoje',
          SUBSCRIPTIONS_LIST: '1. Netflix',
          FORMATTED_DATE: '15/02/2024',
        }
      );
    });

    it('should handle multiple subscriptions', async () => {
      const today = new Date('2024-02-15T12:00:00.000Z');
      const in3Days = new Date('2024-02-18T12:00:00.000Z');
      jest.setSystemTime(today);

      mockResend.sendEmail.mockResolvedValue({
        data: { id: 'email-id' },
        headers: null,
        error: null,
      });

      await adapter.notifyRenewal({
        email: 'test@example.com',
        subscriptionsName: ['Netflix', 'Spotify', 'Disney+', 'Amazon Prime'],
        nextBillingDate: in3Days,
      });

      expect(mockResend.sendEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Lembrete: 4 assinaturas vencem em 3 dias',
        process.env.RESEND_SUBSCRIPTION_RENEW_TEMPLATE ?? '',
        {
          RENEWAL_MESSAGE: 'suas assinaturas vencem em 3 dias',
          SUBSCRIPTIONS_LIST: '1. Netflix<br>2. Spotify<br>3. Disney+<br>4. Amazon Prime',
          FORMATTED_DATE: '18/02/2024',
        }
      );
    });

    it('should use environment variable for template ID', async () => {
      const originalTemplate = process.env.RESEND_SUBSCRIPTION_RENEW_TEMPLATE;
      process.env.RESEND_SUBSCRIPTION_RENEW_TEMPLATE = 'template-123';

      const today = new Date('2024-02-15T12:00:00.000Z');
      jest.setSystemTime(today);

      mockResend.sendEmail.mockResolvedValue({
        data: { id: 'email-id' },
        headers: null,
        error: null,
      });

      await adapter.notifyRenewal({
        email: 'test@example.com',
        subscriptionsName: ['Netflix'],
        nextBillingDate: today,
      });

      expect(mockResend.sendEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'template-123',
        expect.any(Object)
      );

      // Restore original value
      if (originalTemplate) {
        process.env.RESEND_SUBSCRIPTION_RENEW_TEMPLATE = originalTemplate;
      } else {
        delete process.env.RESEND_SUBSCRIPTION_RENEW_TEMPLATE;
      }
    });

    it('should use empty string as fallback when template ID is not set', async () => {
      const originalTemplate = process.env.RESEND_SUBSCRIPTION_RENEW_TEMPLATE;
      delete process.env.RESEND_SUBSCRIPTION_RENEW_TEMPLATE;

      const today = new Date('2024-02-15T12:00:00.000Z');
      jest.setSystemTime(today);

      mockResend.sendEmail.mockResolvedValue({
        data: { id: 'email-id' },
        headers: null,
        error: null,
      });

      await adapter.notifyRenewal({
        email: 'test@example.com',
        subscriptionsName: ['Netflix'],
        nextBillingDate: today,
      });

      expect(mockResend.sendEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        '',
        expect.any(Object)
      );

      // Restore original value
      if (originalTemplate) {
        process.env.RESEND_SUBSCRIPTION_RENEW_TEMPLATE = originalTemplate;
      }
    });

    describe('error handling', () => {
      it('should handle sendEmail error gracefully', async () => {
        const today = new Date('2024-02-15T12:00:00.000Z');
        jest.setSystemTime(today);

        const error = { message: 'Template not found', name: 'ResendError', statusCode: 404 };
        mockResend.sendEmail.mockResolvedValue({
          data: null,
          headers: null,
          error: error as ErrorResponse,
        });

        await adapter.notifyRenewal({
          email: 'test@example.com',
          subscriptionsName: ['Netflix'],
          nextBillingDate: today,
        });

        expect(mockResend.sendEmail).toHaveBeenCalled();
        // Logger should have been called with error (but we don't test logger directly)
      });

      it('should handle successful email send', async () => {
        const today = new Date('2024-02-15T12:00:00.000Z');
        jest.setSystemTime(today);

        mockResend.sendEmail.mockResolvedValue({
          data: { id: 'email-123' },
          headers: null,
          error: null,
        });

        await adapter.notifyRenewal({
          email: 'test@example.com',
          subscriptionsName: ['Netflix'],
          nextBillingDate: today,
        });

        expect(mockResend.sendEmail).toHaveBeenCalled();
        // Logger should have been called with success (but we don't test logger directly)
      });
    });
  });
});
