import { SubscriptionsDrizzleRepository } from '@/modules/subscriptions/infrastucture/repositories/subscriptions-drizzle-repository';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Subscription } from '@/modules/subscriptions/domain/entity/subscription';
import { Money } from '@/modules/subscriptions/domain/value-objects/money';
import { BillingCycle } from '@/modules/subscriptions/domain/value-objects/billing-cycle';
import { SubscriptionMapper } from '@/shared/infrastructure/db/drizzle/mappers/subscription-mappers';

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
  return new Subscription(
    params.id,
    params.userId ?? 'user-1',
    params.name ?? 'Test Subscription',
    new Money(params.price ?? 29.9, params.currency ?? 'BRL'),
    params.currency ?? 'BRL',
    new BillingCycle(params.billingCycle ?? 'MONTHLY'),
    params.status,
    params.startDate ?? new Date('2024-01-01T00:00:00.000Z'),
    params.nextBillingDate ?? new Date('2024-02-01T00:00:00.000Z'),
    params.lastBillingDate ?? null,
    params.renewalNotifiedAt ?? null,
    params.trialEndsAt ?? null,
    params.createdAt ?? new Date('2024-01-01T00:00:00.000Z'),
    params.updatedAt ?? new Date('2024-01-01T00:00:00.000Z')
  );
}

function makeDbRow(subscription: Subscription) {
  return {
    id: subscription.id,
    userId: subscription.userId,
    name: subscription.name,
    price: subscription.price.amount.toFixed(2),
    currency: subscription.currency,
    billingCycle: subscription.billingCycle.getValue(),
    status: subscription.status,
    startDate: subscription.startDate,
    nextBillingDate: subscription.nextBillingDate,
    lastBillingDate: subscription.lastBillingDate,
    renewalNotifiedAt: subscription.renewalNotifiedAt,
    trialEndsAt: subscription.trialEndsAt,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
}

describe('SubscriptionsDrizzleRepository', () => {
  let repository: SubscriptionsDrizzleRepository;
  let mockDb: jest.Mocked<NodePgDatabase<any>>;

  beforeEach(() => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      transaction: jest.fn(),
    } as unknown as jest.Mocked<NodePgDatabase<any>>;

    repository = new SubscriptionsDrizzleRepository(mockDb);
  });

  describe('save', () => {
    it('should save a subscription and return the id', async () => {
      const subscription = makeSubscription({
        id: 1,
        userId: 'user-1',
        name: 'Netflix',
        status: 'ACTIVE',
      });

      const mockReturning = {
        returning: jest.fn().mockResolvedValue([{ id: 1 }]),
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue(mockReturning),
      } as any);

      const result = await repository.save(subscription);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('findById', () => {
    it('should return null when subscription does not exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await repository.findById(999, 'user-1');

      expect(result).toBeNull();
    });

    it('should return subscription when it exists', async () => {
      const subscription = makeSubscription({
        id: 1,
        userId: 'user-1',
        status: 'ACTIVE',
      });

      const row = makeDbRow(subscription);

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([row]),
        }),
      } as any);

      const result = await repository.findById(1, 'user-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.userId).toBe('user-1');
      expect(result?.name).toBe('Test Subscription');
    });
  });

  describe('findByUserId', () => {
    it('should return empty array when user has no subscriptions', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await repository.findByUserId('user-without-subs');

      expect(result).toEqual([]);
    });

    it('should return all subscriptions for a user', async () => {
      const subscription1 = makeSubscription({
        id: 1,
        userId: 'user-1',
        name: 'Netflix',
        status: 'ACTIVE',
      });

      const subscription2 = makeSubscription({
        id: 2,
        userId: 'user-1',
        name: 'Spotify',
        status: 'ACTIVE',
      });

      const rows = [makeDbRow(subscription1), makeDbRow(subscription2)];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(rows),
        }),
      } as any);

      const result = await repository.findByUserId('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });
  });

  describe('update', () => {
    it('should update a subscription and return the updated entity', async () => {
      const subscription = makeSubscription({
        id: 1,
        userId: 'user-1',
        name: 'Updated Name',
        status: 'ACTIVE',
      });

      const updatedRow = makeDbRow(subscription);

      const mockSet = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          { subscriptionsSchema: updatedRow },
        ]),
      };

      mockDb.update.mockReturnValue(mockSet as any);

      const result = await repository.update(subscription, 'user-1');

      expect(mockDb.update).toHaveBeenCalled();
      expect(result.id).toBe(1);
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('findSubscriptionsToNotify', () => {
    it('should return empty array when no subscriptions found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await repository.findSubscriptionsToNotify(7);

      expect(result).toEqual([]);
    });

    it('should return subscriptions that need notification', async () => {
      const subscription = makeSubscription({
        id: 1,
        userId: 'user-1',
        status: 'ACTIVE',
        nextBillingDate: new Date('2024-02-20T00:00:00.000Z'),
        renewalNotifiedAt: null,
      });

      const row = makeDbRow(subscription);

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([row]),
        }),
      } as any);

      const result = await repository.findSubscriptionsToNotify(7);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].status).toBe('ACTIVE');
    });

    it('should filter out already notified subscriptions', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await repository.findSubscriptionsToNotify(7);

      expect(result).toEqual([]);
    });
  });

  describe('findDueForRenewal', () => {
    it('should return empty array when no subscriptions found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      const referenceDate = new Date('2024-02-15T00:00:00.000Z');
      const result = await repository.findDueForRenewal(referenceDate);

      expect(result).toEqual([]);
    });

    it('should return ACTIVE subscriptions with nextBillingDate <= referenceDate', async () => {
      const subscription = makeSubscription({
        id: 1,
        userId: 'user-1',
        status: 'ACTIVE',
        nextBillingDate: new Date('2024-02-15T00:00:00.000Z'),
      });

      const row = makeDbRow(subscription);

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([row]),
        }),
      } as any);

      const referenceDate = new Date('2024-02-15T00:00:00.000Z');
      const result = await repository.findDueForRenewal(referenceDate);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].status).toBe('ACTIVE');
    });

    it('should return TRIAL subscriptions with trialEndsAt <= referenceDate', async () => {
      const subscription = makeSubscription({
        id: 2,
        userId: 'user-1',
        status: 'TRIAL',
        trialEndsAt: new Date('2024-02-15T00:00:00.000Z'),
      });

      const row = makeDbRow(subscription);

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([row]),
        }),
      } as any);

      const referenceDate = new Date('2024-02-15T00:00:00.000Z');
      const result = await repository.findDueForRenewal(referenceDate);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
      expect(result[0].status).toBe('TRIAL');
    });

    it('should return both ACTIVE and TRIAL subscriptions', async () => {
      const activeSubscription = makeSubscription({
        id: 1,
        userId: 'user-1',
        status: 'ACTIVE',
        nextBillingDate: new Date('2024-02-15T00:00:00.000Z'),
      });

      const trialSubscription = makeSubscription({
        id: 2,
        userId: 'user-1',
        status: 'TRIAL',
        trialEndsAt: new Date('2024-02-15T00:00:00.000Z'),
      });

      const rows = [makeDbRow(activeSubscription), makeDbRow(trialSubscription)];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(rows),
        }),
      } as any);

      const referenceDate = new Date('2024-02-15T00:00:00.000Z');
      const result = await repository.findDueForRenewal(referenceDate);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('ACTIVE');
      expect(result[1].status).toBe('TRIAL');
    });

    it('should not return subscriptions with future dates', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      const referenceDate = new Date('2024-02-15T00:00:00.000Z');
      const result = await repository.findDueForRenewal(referenceDate);

      expect(result).toEqual([]);
    });
  });

  describe('updateMany', () => {
    it('should return early when subscriptions array is empty', async () => {
      await repository.updateMany([]);

      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('should update multiple subscriptions in a transaction', async () => {
      const subscription1 = makeSubscription({
        id: 1,
        userId: 'user-1',
        status: 'ACTIVE',
      });

      const subscription2 = makeSubscription({
        id: 2,
        userId: 'user-1',
        status: 'ACTIVE',
      });

      const mockTx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue({ rowCount: 1 }),
        }),
      };

      mockDb.transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await repository.updateMany([subscription1, subscription2]);

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.update).toHaveBeenCalledTimes(2);
    });

    it('should throw error when update fails', async () => {
      const subscription = makeSubscription({
        id: 1,
        userId: 'user-1',
        status: 'ACTIVE',
      });

      const mockTx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue({ rowCount: 0 }),
        }),
      };

      mockDb.transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await expect(repository.updateMany([subscription])).rejects.toThrow(
        'Failed to update subscription 1'
      );
    });
  });
});


