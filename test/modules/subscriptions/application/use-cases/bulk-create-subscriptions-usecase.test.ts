import { BulkCreateSubscriptionsUseCase } from '@/modules/subscriptions/application/use-cases/bulk-create-subscriptions-usecase';
import type { SubscriptionRepository } from '@/modules/subscriptions/application/repositories/subscriptions-repository';
import type { UserRepositoryInterface } from '@/modules/user/domain/repositories/user-repository';
import { UserNotFoundError } from '@/modules/subscriptions/application/errors/user-not-found-errors';
import { User } from '@/modules/user/domain/entities/User';
import type { BulkCreateSubscriptionInput } from '@/modules/subscriptions/infrastucture/http/schemas/bulk-create-subscription.schema';

function makeUser(params: { id?: string; name?: string; email?: string }): User {
  return new User(
    params.id ?? 'user-1',
    params.name ?? 'Test User',
    params.email ?? 'test@example.com',
    false,
    undefined,
    new Date().toISOString(),
    new Date().toISOString()
  );
}

function makeRepo(overrides?: Partial<SubscriptionRepository>): SubscriptionRepository {
  return {
    save: jest.fn(),
    saveMany: jest.fn(),
    updateMany: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findSubscriptionsToNotify: jest.fn(),
    update: jest.fn(),
    findDueForRenewal: jest.fn(),
    ...overrides,
  } as unknown as SubscriptionRepository;
}

function makeUserRepo(overrides?: Partial<UserRepositoryInterface>): UserRepositoryInterface {
  return {
    findById: jest.fn(),
    ...overrides,
  } as unknown as UserRepositoryInterface;
}

describe('BulkCreateSubscriptionsUseCase', () => {
  let subscriptionRepo: SubscriptionRepository;
  let userRepo: UserRepositoryInterface;
  let useCase: BulkCreateSubscriptionsUseCase;

  beforeEach(() => {
    subscriptionRepo = makeRepo();
    userRepo = makeUserRepo();
    useCase = new BulkCreateSubscriptionsUseCase(subscriptionRepo, userRepo);
  });

  describe('when subscriptions array is empty', () => {
    it('should return empty result', async () => {
      const result = await useCase.run([]);

      expect(result).toEqual({
        success: 0,
        failed: 0,
        errors: [],
        createdIds: [],
      });
      expect(userRepo.findById).not.toHaveBeenCalled();
      expect(subscriptionRepo.saveMany).not.toHaveBeenCalled();
    });
  });

  describe('when user does not exist', () => {
    it('should throw UserNotFoundError', async () => {
      const mockUserRepo = makeUserRepo({
        findById: jest.fn().mockResolvedValue(null),
      });

      const useCaseWithNoUser = new BulkCreateSubscriptionsUseCase(subscriptionRepo, mockUserRepo);

      const input = [
        {
          userId: 'non-existent-user',
          name: 'Netflix',
          price: 29.9,
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
        },
      ];

      await expect(useCaseWithNoUser.run(input)).rejects.toThrow(UserNotFoundError);
      expect(subscriptionRepo.saveMany).not.toHaveBeenCalled();
    });
  });

  describe('when domain entity creation succeeds', () => {
    it('should create subscriptions even with trimmed names', async () => {
      const mockUserRepo = makeUserRepo({
        findById: jest.fn().mockResolvedValue(makeUser({ id: 'user-1' })),
      });

      const mockSaveMany = jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const mockSubscriptionRepo = makeRepo({
        saveMany: mockSaveMany,
      });

      const useCaseWithUser = new BulkCreateSubscriptionsUseCase(
        mockSubscriptionRepo,
        mockUserRepo
      );

      const input = [
        {
          userId: 'user-1',
          name: '  Netflix  ', // Will be trimmed
          price: 29.9,
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
        },
        {
          userId: 'user-1',
          name: 'Spotify',
          price: 19.9,
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
        },
      ];

      const result = await useCaseWithUser.run(input);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toEqual([]);
      expect(result.createdIds).toEqual([1, 2]);
      expect(mockSaveMany).toHaveBeenCalledTimes(1);

      const savedSubscriptions = mockSaveMany.mock.calls[0][0];
      expect(savedSubscriptions[0].name).toBe('Netflix'); // Trimmed
      expect(savedSubscriptions[1].name).toBe('Spotify');
    });

    it('should handle subscriptions with trial period', async () => {
      const mockUserRepo = makeUserRepo({
        findById: jest.fn().mockResolvedValue(makeUser({ id: 'user-1' })),
      });

      const mockSaveMany = jest.fn().mockResolvedValue([{ id: 1 }]);

      const mockSubscriptionRepo = makeRepo({
        saveMany: mockSaveMany,
      });

      const useCaseWithUser = new BulkCreateSubscriptionsUseCase(
        mockSubscriptionRepo,
        mockUserRepo
      );

      const input = [
        {
          userId: 'user-1',
          name: 'Netflix',
          price: 29.9,
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
          trialEndsAt: new Date('2024-01-31'), // Valid: after startDate
        },
      ];

      const result = await useCaseWithUser.run(input);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.errors).toEqual([]);
      expect(result.createdIds).toEqual([1]);

      const savedSubscriptions = mockSaveMany.mock.calls[0][0];
      expect(savedSubscriptions[0].trialEndsAt).toEqual(new Date('2024-01-31'));
    });
  });

  describe('when all validations pass', () => {
    it('should save all subscriptions in a single transaction', async () => {
      const mockUserRepo = makeUserRepo({
        findById: jest.fn().mockResolvedValue(makeUser({ id: 'user-1' })),
      });

      const mockSaveMany = jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

      const mockSubscriptionRepo = makeRepo({
        saveMany: mockSaveMany,
      });

      const useCaseWithUser = new BulkCreateSubscriptionsUseCase(
        mockSubscriptionRepo,
        mockUserRepo
      );

      const input = [
        {
          userId: 'user-1',
          name: 'Netflix',
          price: 29.9,
          currency: 'BRL',
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
        },
        {
          userId: 'user-1',
          name: 'Spotify',
          price: 19.9,
          currency: 'BRL',
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-15'),
        },
        {
          userId: 'user-1',
          name: 'GitHub Pro',
          price: 4.0,
          currency: 'USD',
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
          trialEndsAt: new Date('2024-01-31'),
        },
      ];

      const result = await useCaseWithUser.run(input as BulkCreateSubscriptionInput[]);

      expect(result.success).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.errors).toEqual([]);
      expect(result.createdIds).toEqual([1, 2, 3]);
      expect(mockSaveMany).toHaveBeenCalledTimes(1);

      const savedSubscriptions = mockSaveMany.mock.calls[0][0];
      expect(savedSubscriptions).toHaveLength(3);
      expect(savedSubscriptions[0].name).toBe('Netflix');
      expect(savedSubscriptions[0].userId).toBe('user-1');
      expect(savedSubscriptions[1].name).toBe('Spotify');
      expect(savedSubscriptions[1].userId).toBe('user-1');
      expect(savedSubscriptions[2].name).toBe('GitHub Pro');
      expect(savedSubscriptions[2].userId).toBe('user-1');
      expect(savedSubscriptions[2].startDate).toEqual(new Date('2024-01-01'));
      // Note: initialize() may change status based on trialEndsAt and current date
      expect(savedSubscriptions[2].trialEndsAt).toEqual(new Date('2024-01-31'));
    });

    it('should handle subscriptions with different billing cycles', async () => {
      const mockUserRepo = makeUserRepo({
        findById: jest.fn().mockResolvedValue(makeUser({ id: 'user-1' })),
      });

      const mockSaveMany = jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

      const mockSubscriptionRepo = makeRepo({
        saveMany: mockSaveMany,
      });

      const useCaseWithUser = new BulkCreateSubscriptionsUseCase(
        mockSubscriptionRepo,
        mockUserRepo
      );

      const input = [
        {
          userId: 'user-1',
          name: 'Weekly Service',
          price: 10.0,
          billingCycle: 'WEEKLY' as const,
          startDate: new Date('2024-01-01'),
        },
        {
          userId: 'user-1',
          name: 'Monthly Service',
          price: 29.9,
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
        },
        {
          userId: 'user-1',
          name: 'Yearly Service',
          price: 299.0,
          billingCycle: 'YEARLY' as const,
          startDate: new Date('2024-01-01'),
        },
      ];

      const result = await useCaseWithUser.run(input);

      expect(result.success).toBe(3);
      expect(result.failed).toBe(0);
      expect(mockSaveMany).toHaveBeenCalledTimes(1);
    });

    it('should handle currency when provided', async () => {
      const mockUserRepo = makeUserRepo({
        findById: jest.fn().mockResolvedValue(makeUser({ id: 'user-1' })),
      });

      const mockSaveMany = jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const mockSubscriptionRepo = makeRepo({
        saveMany: mockSaveMany,
      });

      const useCaseWithUser = new BulkCreateSubscriptionsUseCase(
        mockSubscriptionRepo,
        mockUserRepo
      );

      const input = [
        {
          userId: 'user-1',
          name: 'Netflix',
          price: 29.9,
          currency: 'BRL' as const,
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
        },
        {
          userId: 'user-1',
          name: 'GitHub Pro',
          price: 4.0,
          currency: 'USD' as const,
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
        },
      ];

      await useCaseWithUser.run(input);

      const savedSubscriptions = mockSaveMany.mock.calls[0][0];
      expect(savedSubscriptions[0].currency).toBe('BRL');
      expect(savedSubscriptions[1].currency).toBe('USD');
    });
  });

  describe('when transaction fails', () => {
    it('should throw error when database operation fails', async () => {
      const mockUserRepo = makeUserRepo({
        findById: jest.fn().mockResolvedValue(makeUser({ id: 'user-1' })),
      });

      const databaseError = new Error('Database connection failed');
      const mockSaveMany = jest.fn().mockRejectedValue(databaseError);

      const mockSubscriptionRepo = makeRepo({
        saveMany: mockSaveMany,
      });

      const useCaseWithUser = new BulkCreateSubscriptionsUseCase(
        mockSubscriptionRepo,
        mockUserRepo
      );

      const input = [
        {
          userId: 'user-1',
          name: 'Netflix',
          price: 29.9,
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
        },
        {
          userId: 'user-1',
          name: 'Spotify',
          price: 19.9,
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
        },
      ];

      await expect(useCaseWithUser.run(input)).rejects.toThrow('Database connection failed');
      expect(mockSaveMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('when processing multiple subscriptions', () => {
    it('should process all subscriptions in a single batch', async () => {
      const mockUserRepo = makeUserRepo({
        findById: jest.fn().mockResolvedValue(makeUser({ id: 'user-1' })),
      });

      const mockSaveMany = jest
        .fn()
        .mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]);

      const mockSubscriptionRepo = makeRepo({
        saveMany: mockSaveMany,
      });

      const useCaseWithUser = new BulkCreateSubscriptionsUseCase(
        mockSubscriptionRepo,
        mockUserRepo
      );

      const input = [
        {
          userId: 'user-1',
          name: 'Netflix',
          price: 29.9,
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
        },
        {
          userId: 'user-1',
          name: 'Spotify',
          price: 19.9,
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
        },
        {
          userId: 'user-1',
          name: 'GitHub Pro',
          price: 4.0,
          currency: 'USD' as const,
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
        },
        {
          userId: 'user-1',
          name: 'Amazon Prime',
          price: 9.99,
          currency: 'USD' as const,
          billingCycle: 'YEARLY' as const,
          startDate: new Date('2024-01-01'),
        },
        {
          userId: 'user-1',
          name: 'Disney+',
          price: 27.9,
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
          trialEndsAt: new Date('2024-01-31'),
        },
      ];

      const result = await useCaseWithUser.run(input);

      expect(result.success).toBe(5);
      expect(result.failed).toBe(0);
      expect(result.errors).toEqual([]);
      expect(result.createdIds).toEqual([1, 2, 3, 4, 5]);
      expect(mockSaveMany).toHaveBeenCalledTimes(1);
      expect(mockSaveMany).toHaveBeenCalledWith(expect.arrayContaining([]));
      expect(mockSaveMany.mock.calls[0][0]).toHaveLength(5);
    });
  });
});
