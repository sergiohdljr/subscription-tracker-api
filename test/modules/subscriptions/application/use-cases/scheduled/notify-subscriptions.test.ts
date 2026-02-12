import type { SubscriptionRepository } from '@/modules/subscriptions/application/repositories/subscriptions-repository';
import type { UserRepositoryInterface } from '@/modules/user/domain/repositories/user-repository';
import type { SubscriptionNotificationService } from '@/modules/subscriptions/application/services/subscription-notification-service';
import { NotifySubscriptionsUseCase } from '@/modules/subscriptions/application/use-cases/scheduled/notify-subscriptions';
import { BillingCycle } from '@/modules/subscriptions/domain/value-objects/billing-cycle';
import { Money } from '@/modules/subscriptions/domain/value-objects/money';
import { Subscription } from '@/modules/subscriptions/domain/entity/subscription';
import { User } from '@/modules/user/domain/entities/User';

function makeSubscription(params: {
  id: number;
  userId?: string;
  name?: string;
  price?: number;
  currency?: 'BRL' | 'USD';
  billingCycle?: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'INACTIVE' | 'TRIAL';
  startDate?: Date;
  nextBillingDate?: Date;
  lastBillingDate?: Date | null;
  renewalNotifiedAt?: Date | null;
  trialEndsAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}): Subscription {
  const today = new Date('2024-02-15T00:00:00.000Z');
  return new Subscription(
    params.id,
    params.userId ?? 'user-1',
    params.name ?? 'Test Subscription',
    new Money(params.price ?? 29.9, params.currency ?? 'BRL'),
    params.currency ?? 'BRL',
    new BillingCycle(params.billingCycle ?? 'MONTHLY'),
    params.status,
    params.startDate ?? today,
    params.nextBillingDate ?? today,
    params.lastBillingDate ?? null,
    params.renewalNotifiedAt ?? null,
    params.trialEndsAt ?? null,
    params.createdAt ?? today,
    params.updatedAt ?? today
  );
}

function makeUser(params: { id?: string; name?: string; email?: string }): User {
  return new User(
    params.id ?? 'user-1',
    params.name ?? 'Test User',
    params.email ?? 'test@example.com'
  );
}

describe('NotifySubscriptionsUseCase', () => {
  let mockSubscriptionRepository: jest.Mocked<SubscriptionRepository>;
  let mockUserRepository: jest.Mocked<UserRepositoryInterface>;
  let mockNotificationService: jest.Mocked<SubscriptionNotificationService>;

  beforeEach(() => {
    mockSubscriptionRepository = {
      findSubscriptionsToNotify: jest.fn(),
      save: jest.fn(),
      updateMany: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      findDueForRenewal: jest.fn(),
    };

    mockUserRepository = {
      findById: jest.fn(),
    };

    mockNotificationService = {
      notifyRenewal: jest.fn(),
    };
  });

  describe('when there are subscriptions to notify', () => {
    it('should send email notification for eligible subscriptions and update renewalNotifiedAt', async () => {
      const today = new Date('2024-02-15T00:00:00.000Z');
      const nextBillingDate = new Date('2024-02-25T00:00:00.000Z'); // 10 days from today

      const subscription1 = makeSubscription({
        id: 1,
        userId: 'user-1',
        name: 'Netflix',
        status: 'ACTIVE',
        nextBillingDate,
        renewalNotifiedAt: null,
      });

      const subscription2 = makeSubscription({
        id: 2,
        userId: 'user-1',
        name: 'Spotify',
        status: 'ACTIVE',
        nextBillingDate,
        renewalNotifiedAt: null,
      });

      const user = makeUser({
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One',
      });

      mockSubscriptionRepository.findSubscriptionsToNotify.mockResolvedValue([
        subscription1,
        subscription2,
      ]);
      mockUserRepository.findById.mockResolvedValue(user);
      mockNotificationService.notifyRenewal.mockResolvedValue();

      // Import dynamic to avoid circular dependency issues
      const useCase = new NotifySubscriptionsUseCase(
        mockSubscriptionRepository,
        mockUserRepository,
        mockNotificationService
      );

      await useCase.run(10, today);

      // Should call findSubscriptionsToNotify with correct daysBefore
      expect(mockSubscriptionRepository.findSubscriptionsToNotify).toHaveBeenCalledWith(10);

      // Should verify user exists
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-1');

      // Should send notification with grouped subscriptions
      expect(mockNotificationService.notifyRenewal).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.notifyRenewal).toHaveBeenCalledWith({
        userId: 'user-1',
        email: 'user1@example.com',
        subscriptionsName: ['Netflix', 'Spotify'],
        nextBillingDate,
      });

      // Should update renewalNotifiedAt for both subscriptions
      expect(mockSubscriptionRepository.updateMany).toHaveBeenCalledTimes(1);
      const updatedSubscriptions = mockSubscriptionRepository.updateMany.mock.calls[0][0];
      expect(updatedSubscriptions).toHaveLength(2);
      expect(updatedSubscriptions[0].renewalNotifiedAt).toBeDefined();
      expect(updatedSubscriptions[1].renewalNotifiedAt).toBeDefined();
    });

    it('should handle multiple users with their own subscriptions', async () => {
      const today = new Date('2024-02-15T00:00:00.000Z');
      const nextBillingDate = new Date('2024-02-25T00:00:00.000Z');

      const subscription1 = makeSubscription({
        id: 1,
        userId: 'user-1',
        name: 'Netflix',
        status: 'ACTIVE',
        nextBillingDate,
        renewalNotifiedAt: null,
      });

      const subscription2 = makeSubscription({
        id: 2,
        userId: 'user-2',
        name: 'Spotify',
        status: 'ACTIVE',
        nextBillingDate,
        renewalNotifiedAt: null,
      });

      const user1 = makeUser({ id: 'user-1', email: 'user1@example.com' });
      const user2 = makeUser({ id: 'user-2', email: 'user2@example.com' });

      mockSubscriptionRepository.findSubscriptionsToNotify.mockResolvedValue([
        subscription1,
        subscription2,
      ]);
      mockUserRepository.findById.mockResolvedValueOnce(user1).mockResolvedValueOnce(user2);
      mockNotificationService.notifyRenewal.mockResolvedValue();

      const useCase = new NotifySubscriptionsUseCase(
        mockSubscriptionRepository,
        mockUserRepository,
        mockNotificationService
      );

      await useCase.run(10, today);

      // Should send separate notifications for each user
      expect(mockNotificationService.notifyRenewal).toHaveBeenCalledTimes(2);
      expect(mockNotificationService.notifyRenewal).toHaveBeenNthCalledWith(1, {
        userId: 'user-1',
        email: 'user1@example.com',
        subscriptionsName: ['Netflix'],
        nextBillingDate,
      });
      expect(mockNotificationService.notifyRenewal).toHaveBeenNthCalledWith(2, {
        userId: 'user-2',
        email: 'user2@example.com',
        subscriptionsName: ['Spotify'],
        nextBillingDate,
      });
    });
  });

  describe('when there are no subscriptions to notify', () => {
    it('should return without sending email when no subscriptions found', async () => {
      const today = new Date('2024-02-15T00:00:00.000Z');

      mockSubscriptionRepository.findSubscriptionsToNotify.mockResolvedValue([]);

      const useCase = new NotifySubscriptionsUseCase(
        mockSubscriptionRepository,
        mockUserRepository,
        mockNotificationService
      );

      await useCase.run(10, today);

      expect(mockSubscriptionRepository.findSubscriptionsToNotify).toHaveBeenCalledWith(10);
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(mockNotificationService.notifyRenewal).not.toHaveBeenCalled();
      expect(mockSubscriptionRepository.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('when user does not exist', () => {
    it('should skip notification for subscriptions with non-existent users', async () => {
      const today = new Date('2024-02-15T00:00:00.000Z');
      const nextBillingDate = new Date('2024-02-25T00:00:00.000Z');

      const subscription = makeSubscription({
        id: 1,
        userId: 'user-1',
        name: 'Netflix',
        status: 'ACTIVE',
        nextBillingDate,
        renewalNotifiedAt: null,
      });

      mockSubscriptionRepository.findSubscriptionsToNotify.mockResolvedValue([subscription]);
      mockUserRepository.findById.mockResolvedValue(null);

      const useCase = new NotifySubscriptionsUseCase(
        mockSubscriptionRepository,
        mockUserRepository,
        mockNotificationService
      );

      await useCase.run(10, today);

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-1');
      expect(mockNotificationService.notifyRenewal).not.toHaveBeenCalled();
      expect(mockSubscriptionRepository.updateMany).not.toHaveBeenCalled();
    });

    it('should process other users even if one user does not exist', async () => {
      const today = new Date('2024-02-15T00:00:00.000Z');
      const nextBillingDate = new Date('2024-02-25T00:00:00.000Z');

      const subscription1 = makeSubscription({
        id: 1,
        userId: 'user-1',
        name: 'Netflix',
        status: 'ACTIVE',
        nextBillingDate,
        renewalNotifiedAt: null,
      });

      const subscription2 = makeSubscription({
        id: 2,
        userId: 'user-2',
        name: 'Spotify',
        status: 'ACTIVE',
        nextBillingDate,
        renewalNotifiedAt: null,
      });

      const user2 = makeUser({ id: 'user-2', email: 'user2@example.com' });

      mockSubscriptionRepository.findSubscriptionsToNotify.mockResolvedValue([
        subscription1,
        subscription2,
      ]);
      mockUserRepository.findById
        .mockResolvedValueOnce(null) // user-1 does not exist
        .mockResolvedValueOnce(user2); // user-2 exists

      mockNotificationService.notifyRenewal.mockResolvedValue();

      const useCase = new NotifySubscriptionsUseCase(
        mockSubscriptionRepository,
        mockUserRepository,
        mockNotificationService
      );

      await useCase.run(10, today);

      // Should only notify user-2
      expect(mockNotificationService.notifyRenewal).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.notifyRenewal).toHaveBeenCalledWith({
        userId: 'user-2',
        email: 'user2@example.com',
        subscriptionsName: ['Spotify'],
        nextBillingDate,
      });

      // Should only update subscription for user-2
      expect(mockSubscriptionRepository.updateMany).toHaveBeenCalledTimes(1);
      const updatedSubscriptions = mockSubscriptionRepository.updateMany.mock.calls[0][0];
      expect(updatedSubscriptions).toHaveLength(1);
      expect(updatedSubscriptions[0].id).toBe(2);
    });
  });

  describe('when subscription already notified', () => {
    it('should filter out subscriptions that were already notified', async () => {
      const today = new Date('2024-02-15T00:00:00.000Z');
      const nextBillingDate = new Date('2024-02-25T00:00:00.000Z');

      const subscription1 = makeSubscription({
        id: 1,
        userId: 'user-1',
        name: 'Netflix',
        status: 'ACTIVE',
        nextBillingDate,
        renewalNotifiedAt: new Date('2024-02-14T00:00:00.000Z'), // Already notified
      });

      const subscription2 = makeSubscription({
        id: 2,
        userId: 'user-1',
        name: 'Spotify',
        status: 'ACTIVE',
        nextBillingDate,
        renewalNotifiedAt: null, // Not notified yet
      });

      const user = makeUser({ id: 'user-1', email: 'user1@example.com' });

      mockSubscriptionRepository.findSubscriptionsToNotify.mockResolvedValue([
        subscription1,
        subscription2,
      ]);
      mockUserRepository.findById.mockResolvedValue(user);
      mockNotificationService.notifyRenewal.mockResolvedValue();

      const useCase = new NotifySubscriptionsUseCase(
        mockSubscriptionRepository,
        mockUserRepository,
        mockNotificationService
      );

      await useCase.run(10, today);

      // Should only notify for subscription2 (subscription1 already notified)
      expect(mockNotificationService.notifyRenewal).toHaveBeenCalledWith({
        userId: 'user-1',
        email: 'user1@example.com',
        subscriptionsName: ['Spotify'],
        nextBillingDate,
      });

      // Should only update subscription2
      const updatedSubscriptions = mockSubscriptionRepository.updateMany.mock.calls[0][0];
      expect(updatedSubscriptions).toHaveLength(1);
      expect(updatedSubscriptions[0].id).toBe(2);
    });
  });

  describe('when subscription is INACTIVE', () => {
    it('should filter out inactive subscriptions', async () => {
      const today = new Date('2024-02-15T00:00:00.000Z');
      const nextBillingDate = new Date('2024-02-25T00:00:00.000Z');

      const activeSubscription = makeSubscription({
        id: 1,
        userId: 'user-1',
        name: 'Netflix',
        status: 'ACTIVE',
        nextBillingDate,
        renewalNotifiedAt: null,
      });

      const inactiveSubscription = makeSubscription({
        id: 2,
        userId: 'user-1',
        name: 'Canceled Service',
        status: 'INACTIVE',
        nextBillingDate,
        renewalNotifiedAt: null,
      });

      const user = makeUser({ id: 'user-1', email: 'user1@example.com' });

      mockSubscriptionRepository.findSubscriptionsToNotify.mockResolvedValue([
        activeSubscription,
        inactiveSubscription,
      ]);
      mockUserRepository.findById.mockResolvedValue(user);
      mockNotificationService.notifyRenewal.mockResolvedValue();

      const useCase = new NotifySubscriptionsUseCase(
        mockSubscriptionRepository,
        mockUserRepository,
        mockNotificationService
      );

      await useCase.run(10, today);

      // Should only notify for active subscription
      expect(mockNotificationService.notifyRenewal).toHaveBeenCalledWith({
        userId: 'user-1',
        email: 'user1@example.com',
        subscriptionsName: ['Netflix'],
        nextBillingDate,
      });

      // Should only update active subscription
      const updatedSubscriptions = mockSubscriptionRepository.updateMany.mock.calls[0][0];
      expect(updatedSubscriptions).toHaveLength(1);
      expect(updatedSubscriptions[0].id).toBe(1);
    });
  });
});
