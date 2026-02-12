import { ProcessRenewalsUseCase } from '@/modules/subscriptions/application/use-cases/scheduled/ process-renewals';
import type { SubscriptionRepository } from '@/modules/subscriptions/application/repositories/subscriptions-repository';
import { BillingCycle } from '@/modules/subscriptions/domain/value-objects/billing-cycle';
import { Money } from '@/modules/subscriptions/domain/value-objects/money';
import { Subscription } from '@/modules/subscriptions/domain/entity/subscription';

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
    params.userId ?? `user_${params.id}`,
    params.name ?? `sub_${params.id}`,
    new Money(params.price ?? 10, params.currency ?? 'BRL'),
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

function makeRepo(overrides?: Partial<SubscriptionRepository>): SubscriptionRepository {
  return {
    save: jest.fn(),
    updateMany: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findSubscriptionsToNotify: jest.fn(),
    update: jest.fn(),
    findDueForRenewal: jest.fn(),
    ...overrides,
  } as unknown as SubscriptionRepository;
}

describe('ProcessRenewalsUseCase', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-02-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should activate eligible TRIAL subscriptions and renew ACTIVE subscriptions, then call updateMany with only updated ones', async () => {
    const today = new Date('2024-02-01T00:00:00.000Z');

    const trialEligible = makeSubscription({
      id: 1,
      status: 'TRIAL',
      billingCycle: 'MONTHLY',
      trialEndsAt: new Date('2024-02-01T00:00:00.000Z'),
      nextBillingDate: new Date('2024-02-10T00:00:00.000Z'), // overwritten on activateFromTrial
    });

    const trialNotEligible = makeSubscription({
      id: 2,
      status: 'TRIAL',
      trialEndsAt: new Date('2024-02-10T00:00:00.000Z'),
    });

    const active = makeSubscription({
      id: 3,
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      nextBillingDate: new Date('2024-02-01T00:00:00.000Z'),
      lastBillingDate: null,
    });

    const inactive = makeSubscription({
      id: 4,
      status: 'INACTIVE',
    });

    const updateMany = jest.fn().mockResolvedValue(undefined);
    const repo = makeRepo({
      findDueForRenewal: jest
        .fn()
        .mockResolvedValue([trialEligible, trialNotEligible, active, inactive]),
      updateMany,
    });

    const useCase = new ProcessRenewalsUseCase(repo);

    await useCase.run(today);

    // TRIAL eligible -> becomes ACTIVE, trialEndsAt null, nextBillingDate advanced from today
    expect(trialEligible.status).toBe('ACTIVE');
    expect(trialEligible.trialEndsAt).toBeNull();
    expect(trialEligible.nextBillingDate).toEqual(new BillingCycle('MONTHLY').addTo(today));

    // TRIAL not eligible -> unchanged
    expect(trialNotEligible.status).toBe('TRIAL');
    expect(trialNotEligible.trialEndsAt).toEqual(new Date('2024-02-10T00:00:00.000Z'));

    // ACTIVE -> renewed: lastBillingDate becomes previous nextBillingDate, nextBillingDate advances
    const previousNextBillingDate = new Date('2024-02-01T00:00:00.000Z');
    expect(active.lastBillingDate).toEqual(previousNextBillingDate);
    expect(active.nextBillingDate).toEqual(
      new BillingCycle('MONTHLY').addTo(previousNextBillingDate)
    );

    // INACTIVE -> unchanged (not pushed)
    expect(inactive.status).toBe('INACTIVE');

    expect(updateMany).toHaveBeenCalledTimes(1);
    const [updated] = updateMany.mock.calls[0];
    expect(updated).toHaveLength(2);
    expect(updated).toEqual([trialEligible, active]);
  });

  it('should call updateMany with an empty list when nothing changes', async () => {
    const today = new Date('2024-02-01T00:00:00.000Z');

    const trialNotEligible = makeSubscription({
      id: 10,
      status: 'TRIAL',
      trialEndsAt: new Date('2024-02-10T00:00:00.000Z'),
    });

    const inactive = makeSubscription({
      id: 11,
      status: 'INACTIVE',
    });

    const updateMany = jest.fn().mockResolvedValue(undefined);
    const repo = makeRepo({
      findDueForRenewal: jest.fn().mockResolvedValue([trialNotEligible, inactive]),
      updateMany,
    });

    const useCase = new ProcessRenewalsUseCase(repo);

    await useCase.run(today);

    expect(updateMany).toHaveBeenCalledWith([]);
  });
});
