import { SubscriptionMapper } from '@/shared/infrastructure/db/drizzle/mappers/subscription-mappers';
import { BillingCycle } from '@/modules/subscriptions/domain/value-objects/billing-cycle';
import { Money } from '@/modules/subscriptions/domain/value-objects/money';
import { Subscription } from '@/modules/subscriptions/domain/entity/subscription';

describe('SubscriptionMapper', () => {
  describe('toDomain', () => {
    it('should map a persistence row into a Subscription domain entity', () => {
      const startDate = new Date('2024-01-01T00:00:00.000Z');
      const nextBillingDate = new Date('2024-02-01T00:00:00.000Z');
      const lastBillingDate = new Date('2023-12-01T00:00:00.000Z');
      const renewalNotifiedAt = new Date('2024-01-25T00:00:00.000Z');
      const trialEndsAt = new Date('2024-01-15T00:00:00.000Z');
      const createdAt = new Date('2024-01-01T10:00:00.000Z');
      const updatedAt = new Date('2024-01-02T10:00:00.000Z');

      const row = {
        id: 123,
        userId: 'user_1',
        name: 'Netflix',
        price: '29.90',
        currency: 'BRL',
        billingCycle: 'MONTHLY',
        status: 'ACTIVE',
        startDate,
        nextBillingDate,
        lastBillingDate,
        renewalNotifiedAt,
        trialEndsAt,
        createdAt,
        updatedAt,
        // biome-ignore lint/suspicious/noExplicitAny: Test fixture with partial type
      } as any;

      const subscription = SubscriptionMapper.toDomain(row);

      expect(subscription).toBeInstanceOf(Subscription);
      expect(subscription.id).toBe(123);
      expect(subscription.userId).toBe('user_1');
      expect(subscription.name).toBe('Netflix');
      expect(subscription.status).toBe('ACTIVE');

      expect(subscription.price).toBeInstanceOf(Money);
      expect(subscription.price.amount).toBe(29.9);
      expect(subscription.price.currency).toBe('BRL');
      expect(subscription.currency).toBe('BRL');

      expect(subscription.billingCycle).toBeInstanceOf(BillingCycle);
      expect(subscription.billingCycle.getValue()).toBe('MONTHLY');

      expect(subscription.startDate).toEqual(startDate);
      expect(subscription.nextBillingDate).toEqual(nextBillingDate);
      expect(subscription.lastBillingDate).toEqual(lastBillingDate);
      expect(subscription.renewalNotifiedAt).toEqual(renewalNotifiedAt);
      expect(subscription.trialEndsAt).toEqual(trialEndsAt);
      expect(subscription.createdAt).toEqual(createdAt);
      expect(subscription.updatedAt).toEqual(updatedAt);
    });

    it('should preserve nullable date fields as null', () => {
      const row = {
        id: 1,
        userId: 'user_2',
        name: 'Spotify',
        price: '19.99',
        currency: 'USD',
        billingCycle: 'YEARLY',
        status: 'INACTIVE',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        nextBillingDate: new Date('2025-01-01T00:00:00.000Z'),
        lastBillingDate: null,
        renewalNotifiedAt: null,
        trialEndsAt: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
        // biome-ignore lint/suspicious/noExplicitAny: Test fixture with partial type
      } as any;

      const subscription = SubscriptionMapper.toDomain(row);

      expect(subscription.lastBillingDate).toBeNull();
      expect(subscription.renewalNotifiedAt).toBeNull();
      expect(subscription.trialEndsAt).toBeNull();
    });
  });

  describe('toInsert', () => {
    it('should map a Subscription domain entity into insert persistence shape', () => {
      const subscription = new Subscription(
        999,
        'user_3',
        'Prime Video',
        new Money(29.9, 'BRL'),
        'BRL',
        new BillingCycle('MONTHLY'),
        'ACTIVE',
        new Date('2024-01-01T00:00:00.000Z'),
        new Date('2024-02-01T00:00:00.000Z'),
        null,
        null,
        null,
        new Date('2024-01-01T10:00:00.000Z'),
        new Date('2024-01-02T10:00:00.000Z')
      );

      // biome-ignore lint/suspicious/noExplicitAny: Test assertion with partial type
      const insert = SubscriptionMapper.toInsert(subscription) as any;

      expect(insert).toMatchObject({
        userId: 'user_3',
        name: 'Prime Video',
        price: '29.90',
        currency: 'BRL',
        billingCycle: 'MONTHLY',
        status: 'ACTIVE',
      });

      expect(insert.startDate).toEqual(subscription.startDate);
      expect(insert.nextBillingDate).toEqual(subscription.nextBillingDate);
      expect(insert.lastBillingDate).toBeNull();
      expect(insert.renewalNotifiedAt).toBeNull();
      expect(insert.trialEndsAt).toBeNull();
      expect(insert.createdAt).toEqual(subscription.createdAt);
      expect(insert.updatedAt).toEqual(subscription.updatedAt);
    });
  });
});
