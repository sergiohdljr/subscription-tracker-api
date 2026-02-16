import { db } from '@/shared/infrastructure/db/drizzle/connection-pool';
import { SubscriptionsDrizzleRepository } from '@/modules/subscriptions/infrastucture/repositories/subscriptions-drizzle-repository';
import { drizzleUserRepository } from '@/modules/user/infrastructure/repositories/drizzle-user-repository';
import { ApiKeyDrizzleRepository } from '@/modules/identity/infrastructure/repositories/api-key-drizzle-repository';
import { CreateSubscriptionUseCase } from '@/modules/subscriptions/application/use-cases/create-subscription-usecase';
import { ListSubscriptionsUseCase } from '@/modules/subscriptions/application/use-cases/list-subscriptions';
import { ProcessRenewalsUseCase } from '@/modules/subscriptions/application/use-cases/scheduled/ process-renewals';
import { NotifySubscriptionsUseCase } from '@/modules/subscriptions/application/use-cases/scheduled/notify-subscriptions';
import { CreateSubscriptionController } from '../http/controllers/create-subscription-controller';
import { ListSubscriptionsController } from '../http/controllers/list-subscriptions-controller';
import { ProcessRenewalsController } from '../http/controllers/process-renewals-controller';
import { NotifySubscriptionsController } from '../http/controllers/notify-subscriptions-controller';
import { createApiKeyGuard } from '@/modules/auth/infrastructure/http/strategies/api-key/api-key.guard';
import { ResendSubscriptionNotificationAdapter } from '@/shared/infrastructure/notifications/email/resend-subscription-notification-adapter';
import { resendAdapter } from '@/shared/infrastructure/email/resend';

/**
 * Factory for creating subscription-related dependencies
 * This is the Composition Root for the subscriptions module
 */
export class SubscriptionFactory {
  // Repositories (singleton pattern)
  private static subscriptionsRepository: SubscriptionsDrizzleRepository | null = null;
  private static userRepository: drizzleUserRepository | null = null;
  private static apiKeyRepository: ApiKeyDrizzleRepository | null = null;

  private static getSubscriptionsRepository(): SubscriptionsDrizzleRepository {
    if (!this.subscriptionsRepository) {
      this.subscriptionsRepository = new SubscriptionsDrizzleRepository(db);
    }
    return this.subscriptionsRepository;
  }

  private static getUserRepository() {
    if (!this.userRepository) {
      this.userRepository = new drizzleUserRepository(db);
    }
    return this.userRepository;
  }

  private static getApiKeyRepository(): ApiKeyDrizzleRepository {
    if (!this.apiKeyRepository) {
      this.apiKeyRepository = new ApiKeyDrizzleRepository(db);
    }
    return this.apiKeyRepository;
  }

  // Use Cases (can be used by HTTP, CLI, Workers, etc.)
  static createCreateSubscriptionUseCase(): CreateSubscriptionUseCase {
    const subscriptionsRepo = this.getSubscriptionsRepository();
    const userRepo = this.getUserRepository();
    return new CreateSubscriptionUseCase(subscriptionsRepo, userRepo);
  }

  static createListSubscriptionsUseCase(): ListSubscriptionsUseCase {
    const subscriptionsRepo = this.getSubscriptionsRepository();
    const userRepo = this.getUserRepository();
    return new ListSubscriptionsUseCase(subscriptionsRepo, userRepo);
  }

  static createProcessRenewalsUseCase(): ProcessRenewalsUseCase {
    const subscriptionsRepo = this.getSubscriptionsRepository();
    return new ProcessRenewalsUseCase(subscriptionsRepo);
  }

  static createNotifySubscriptionsUseCase(): NotifySubscriptionsUseCase {
    const subscriptionsRepo = this.getSubscriptionsRepository();
    const userRepo = this.getUserRepository();
    const notificationService = new ResendSubscriptionNotificationAdapter(resendAdapter);
    return new NotifySubscriptionsUseCase(subscriptionsRepo, userRepo, notificationService);
  }

  // HTTP Controllers (specific to HTTP layer)
  static createCreateSubscriptionController(): CreateSubscriptionController {
    const useCase = this.createCreateSubscriptionUseCase();
    return new CreateSubscriptionController(useCase);
  }

  static createListSubscriptionsController(): ListSubscriptionsController {
    const useCase = this.createListSubscriptionsUseCase();
    return new ListSubscriptionsController(useCase);
  }

  static createProcessRenewalsController(): ProcessRenewalsController {
    const useCase = this.createProcessRenewalsUseCase();
    return new ProcessRenewalsController(useCase);
  }

  static createNotifySubscriptionsController(): NotifySubscriptionsController {
    const useCase = this.createNotifySubscriptionsUseCase();
    return new NotifySubscriptionsController(useCase);
  }

  // Guards (specific to HTTP layer)
  static createApiKeyGuard() {
    const apiKeyRepo = this.getApiKeyRepository();
    return createApiKeyGuard(apiKeyRepo);
  }
}
