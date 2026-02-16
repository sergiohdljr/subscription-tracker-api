import { BulkCreateSubscriptionsUseCase } from '@/modules/subscriptions/application/use-cases/bulk-create-subscriptions-usecase';
import type { SubscriptionRepository } from '@/modules/subscriptions/application/repositories/subscriptions-repository';
import type { UserRepositoryInterface } from '@/modules/user/domain/repositories/user-repository';
import { UserNotFoundError } from '@/modules/subscriptions/application/errors/user-not-found-errors';
import { User } from '@/modules/user/domain/entities/User';

function makeUser(params: { id?: string; name?: string; email?: string }): User {
  return new User(
    params.id ?? 'user-1',
    params.name ?? 'Test User',
    params.email ?? 'test@example.com',
    false,
    null,
    new Date(),
    new Date()
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

  describe('when validation fails', () => {
    it('should return errors for invalid subscription names', async () => {
      const mockUserRepo = makeUserRepo({
        findById: jest.fn().mockResolvedValue(makeUser({ id: 'user-1' })),
      });

      const useCaseWithUser = new BulkCreateSubscriptionsUseCase(subscriptionRepo, mockUserRepo);

      const input = [
        {
          userId: 'user-1',
          name: '', // Invalid: empty name
          price: 29.9,
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
        },
        {
          userId: 'user-1',
          name: '   ', // Invalid: only whitespace
          price: 19.9,
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
        },
      ];

      const result = await useCaseWithUser.run(input);

      expect(result.success).toBe(0);
      expect(result.failed).toBe(2);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].row).toBe(2);
      expect(result.errors[0].error).toContain('invalid');
      expect(result.errors[1].row).toBe(3);
      expect(result.createdIds).toEqual([]);
      expect(subscriptionRepo.saveMany).not.toHaveBeenCalled();
    });

    it('should return errors for invalid trial period', async () => {
      const mockUserRepo = makeUserRepo({
        findById: jest.fn().mockResolvedValue(makeUser({ id: 'user-1' })),
      });

      const useCaseWithUser = new BulkCreateSubscriptionsUseCase(subscriptionRepo, mockUserRepo);

      const input = [
        {
          userId: 'user-1',
          name: 'Netflix',
          price: 29.9,
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-15'),
          trialEndsAt: new Date('2024-01-01'), // Invalid: before startDate
        },
      ];

      const result = await useCaseWithUser.run(input);

      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(2);
      expect(result.errors[0].error).toContain('Trial');
      expect(subscriptionRepo.saveMany).not.toHaveBeenCalled();
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

      const result = await useCaseWithUser.run(input);

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

    it('should use default currency BRL when not provided', async () => {
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
          // currency not provided
          billingCycle: 'MONTHLY' as const,
          startDate: new Date('2024-01-01'),
        },
      ];

      await useCaseWithUser.run(input);

      const savedSubscriptions = mockSaveMany.mock.calls[0][0];
      expect(savedSubscriptions[0].currency).toBe('BRL');
    });
  });

  describe('when transaction fails', () => {
    it('should return error result without creating any subscriptions', async () => {
      const mockUserRepo = makeUserRepo({
        findById: jest.fn().mockResolvedValue(makeUser({ id: 'user-1' })),
      });

      const mockSaveMany = jest.fn().mockRejectedValue(new Error('Database connection failed'));

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

      const result = await useCaseWithUser.run(input);

      expect(result.success).toBe(0);
      expect(result.failed).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Database connection failed');
      expect(result.createdIds).toEqual([]);
    });
  });

  describe('when some subscriptions have validation errors and others are valid', () => {
    it('should not save any subscriptions if any validation fails', async () => {
      const mockUserRepo = makeUserRepo({
        findById: jest.fn().mockResolvedValue(makeUser({ id: 'user-1' })),
      });

      const useCaseWithUser = new BulkCreateSubscriptionsUseCase(subscriptionRepo, mockUserRepo);

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
          name: '', // Invalid
          price: 19.9,
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

      expect(result.success).toBe(0);
      expect(result.failed).toBe(3);
      expect(result.errors).toHaveLength(1); // Only the invalid one
      expect(result.createdIds).toEqual([]);
      expect(subscriptionRepo.saveMany).not.toHaveBeenCalled();
    });
  });
});
