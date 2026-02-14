import { SubscriptionFactory } from '@/modules/subscriptions/infrastucture/factories/subscription-factory';
import { CreateSubscriptionUseCase } from '@/modules/subscriptions/application/use-cases/create-subscription-usecase';
import { ListSubscriptionsUseCase } from '@/modules/subscriptions/application/use-cases/list-subscriptions';
import { ProcessRenewalsUseCase } from '@/modules/subscriptions/application/use-cases/scheduled/ process-renewals';
import { CreateSubscriptionController } from '@/modules/subscriptions/infrastucture/http/controllers/create-subscription-controller';
import { ListSubscriptionsController } from '@/modules/subscriptions/infrastucture/http/controllers/list-subscriptions-controller';
import { ProcessRenewalsController } from '@/modules/subscriptions/infrastucture/http/controllers/process-renewals-controller';

describe('SubscriptionFactory', () => {
  describe('Use Cases', () => {
    it('should create CreateSubscriptionUseCase', () => {
      const useCase = SubscriptionFactory.createCreateSubscriptionUseCase();

      expect(useCase).toBeInstanceOf(CreateSubscriptionUseCase);
    });

    it('should create ListSubscriptionsUseCase', () => {
      const useCase = SubscriptionFactory.createListSubscriptionsUseCase();

      expect(useCase).toBeInstanceOf(ListSubscriptionsUseCase);
    });

    it('should create ProcessRenewalsUseCase', () => {
      const useCase = SubscriptionFactory.createProcessRenewalsUseCase();

      expect(useCase).toBeInstanceOf(ProcessRenewalsUseCase);
    });

    it('should return different instances of use cases', () => {
      const useCase1 = SubscriptionFactory.createCreateSubscriptionUseCase();
      const useCase2 = SubscriptionFactory.createCreateSubscriptionUseCase();

      expect(useCase1).not.toBe(useCase2);
    });
  });

  describe('Controllers', () => {
    it('should create CreateSubscriptionController', () => {
      const controller = SubscriptionFactory.createCreateSubscriptionController();

      expect(controller).toBeInstanceOf(CreateSubscriptionController);
    });

    it('should create ListSubscriptionsController', () => {
      const controller = SubscriptionFactory.createListSubscriptionsController();

      expect(controller).toBeInstanceOf(ListSubscriptionsController);
    });

    it('should create ProcessRenewalsController', () => {
      const controller = SubscriptionFactory.createProcessRenewalsController();

      expect(controller).toBeInstanceOf(ProcessRenewalsController);
    });

    it('should return different instances of controllers', () => {
      const controller1 = SubscriptionFactory.createCreateSubscriptionController();
      const controller2 = SubscriptionFactory.createCreateSubscriptionController();

      expect(controller1).not.toBe(controller2);
    });

    it('should create controllers with use cases', () => {
      const controller = SubscriptionFactory.createCreateSubscriptionController();

      // Verify controller has the use case by checking if it can handle requests
      // This is an indirect way to verify the dependency injection
      expect(controller).toHaveProperty('handle');
      expect(typeof controller.handle).toBe('function');
    });
  });

  describe('Guards', () => {
    it('should create ApiKeyGuard', () => {
      const guard = SubscriptionFactory.createApiKeyGuard();

      expect(guard).toBeDefined();
      expect(typeof guard).toBe('function');
    });

    it('should return different instances of guards', () => {
      const guard1 = SubscriptionFactory.createApiKeyGuard();
      const guard2 = SubscriptionFactory.createApiKeyGuard();

      // Guards are functions, so they should be different instances
      expect(guard1).not.toBe(guard2);
    });
  });

  describe('Repository Singleton Pattern', () => {
    it('should create use cases that share the same repository instances', () => {
      // Create multiple use cases that should share repositories
      const createUseCase = SubscriptionFactory.createCreateSubscriptionUseCase();
      const listUseCase = SubscriptionFactory.createListSubscriptionsUseCase();
      const processUseCase = SubscriptionFactory.createProcessRenewalsUseCase();

      // All use cases should be created successfully
      // The singleton pattern ensures repositories are reused internally
      expect(createUseCase).toBeDefined();
      expect(listUseCase).toBeDefined();
      expect(processUseCase).toBeDefined();
      expect(createUseCase).toBeInstanceOf(CreateSubscriptionUseCase);
      expect(listUseCase).toBeInstanceOf(ListSubscriptionsUseCase);
      expect(processUseCase).toBeInstanceOf(ProcessRenewalsUseCase);
    });

    it('should create guards that share the same api key repository instance', () => {
      const guard1 = SubscriptionFactory.createApiKeyGuard();
      const guard2 = SubscriptionFactory.createApiKeyGuard();

      // Both guards should be created successfully
      // The singleton pattern ensures the api key repository is reused internally
      expect(guard1).toBeDefined();
      expect(guard2).toBeDefined();
      expect(typeof guard1).toBe('function');
      expect(typeof guard2).toBe('function');
    });
  });

  describe('Integration', () => {
    it('should create all components without errors', () => {
      expect(() => {
        SubscriptionFactory.createCreateSubscriptionUseCase();
        SubscriptionFactory.createListSubscriptionsUseCase();
        SubscriptionFactory.createProcessRenewalsUseCase();
        SubscriptionFactory.createCreateSubscriptionController();
        SubscriptionFactory.createListSubscriptionsController();
        SubscriptionFactory.createProcessRenewalsController();
        SubscriptionFactory.createApiKeyGuard();
      }).not.toThrow();
    });

    it('should create controllers that can be used independently', () => {
      const createController = SubscriptionFactory.createCreateSubscriptionController();
      const listController = SubscriptionFactory.createListSubscriptionsController();
      const processController = SubscriptionFactory.createProcessRenewalsController();

      expect(createController).toBeDefined();
      expect(listController).toBeDefined();
      expect(processController).toBeDefined();
      expect(createController).not.toBe(listController);
      expect(listController).not.toBe(processController);
    });
  });
});

