import type { SubscriptionRepository } from '../repositories/subscriptions-repository';
import type { UserRepositoryInterface } from '@/modules/user/domain/repositories/user-repository';
import { Subscription, type SubscriptionStatus } from '../../domain/entity/subscription';
import { Money, type Currency } from '../../domain/value-objects/money';
import { BillingCycle } from '../../domain/value-objects/billing-cycle';
import { UserNotFoundError } from '../errors/user-not-found-errors';
import { InvalidSubscriptionNameError } from '../../domain/errors/invalid-subscription-name';
import { InvalidTrialPeriodError } from '../../domain/errors/invalid-trial-period';
import { createContextLogger } from '@/shared/infrastructure/logging/logger';

const logger = createContextLogger('bulk-create-subscriptions-usecase');

export interface BulkCreateSubscriptionInput {
    userId: string;
    name: string;
    price: number;
    currency?: string;
    billingCycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    startDate: Date;
    trialEndsAt?: Date;
}

export interface BulkCreateResult {
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string; data: BulkCreateSubscriptionInput }>;
    createdIds: number[];
}

export class BulkCreateSubscriptionsUseCase {
    constructor(
        private readonly subscriptionsRepository: SubscriptionRepository,
        private readonly userRepository: UserRepositoryInterface
    ) { }

    async run(subscriptions: BulkCreateSubscriptionInput[]): Promise<BulkCreateResult> {
        if (subscriptions.length === 0) {
            return {
                success: 0,
                failed: 0,
                errors: [],
                createdIds: [],
            };
        }

        // Validar se o usuário existe (uma vez só)
        const userId = subscriptions[0].userId;
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new UserNotFoundError();
        }

        // Validar e criar todas as entidades de domínio ANTES de salvar
        const domainSubscriptions: Subscription[] = [];
        const validationErrors: Array<{ row: number; error: string; data: BulkCreateSubscriptionInput }> = [];

        for (let i = 0; i < subscriptions.length; i++) {
            const input = subscriptions[i];
            const rowNumber = i + 2; // +2 porque linha 1 é header

            try {
                // Validações de domínio
                if (!input.name || input.name.trim().length === 0) {
                    throw new InvalidSubscriptionNameError();
                }

                if (input.trialEndsAt && input.trialEndsAt < input.startDate) {
                    throw new InvalidTrialPeriodError();
                }

                // Criar entidades de domínio
                const price = new Money(input.price, (input.currency || 'BRL') as Currency);
                const billingCycle = new BillingCycle(input.billingCycle);
                const status: SubscriptionStatus = input.trialEndsAt ? 'TRIAL' : 'ACTIVE';

                const subscription = new Subscription(
                    1, // placeholder - será gerado pelo banco
                    input.userId,
                    input.name.trim(),
                    price,
                    price.currency,
                    billingCycle,
                    status,
                    input.startDate,
                    new Date(0), // placeholder - será calculado no initialize
                    null, // lastBillingDate
                    null, // renewalNotifiedAt
                    input.trialEndsAt ?? null,
                    new Date(),
                    new Date()
                );

                subscription.initialize();

                domainSubscriptions.push(subscription);
            } catch (error) {
                validationErrors.push({
                    row: rowNumber,
                    error: error instanceof Error ? error.message : 'Unknown validation error',
                    data: input,
                });
                logger.warn({ row: rowNumber, error, input }, 'Validation failed for subscription');
            }
        }

        // Se houver erros de validação, retornar sem salvar nada
        if (validationErrors.length > 0) {
            return {
                success: 0,
                failed: subscriptions.length,
                errors: validationErrors,
                createdIds: [],
            };
        }

        // Se todas as validações passaram, salvar TODAS em uma única transação ACID
        try {
            const results = await this.subscriptionsRepository.saveMany(domainSubscriptions);
            const createdIds = results.map((r) => r.id);

            logger.info(
                { count: createdIds.length, userId },
                'Bulk create subscriptions completed successfully'
            );

            return {
                success: createdIds.length,
                failed: 0,
                errors: [],
                createdIds,
            };
        } catch (error) {
            // Se a transação falhar, nenhuma subscription foi criada (rollback automático)
            logger.error({ error, userId, count: domainSubscriptions.length }, 'Transaction failed');

            return {
                success: 0,
                failed: subscriptions.length,
                errors: [
                    {
                        row: 0, // Erro geral
                        error: error instanceof Error ? error.message : 'Transaction failed',
                        data: subscriptions[0], // Exemplo
                    },
                ],
                createdIds: [],
            };
        }
    }
}

