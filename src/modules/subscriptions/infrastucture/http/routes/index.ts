import { FastifyInstance } from "fastify";
import { CreateSubscriptionController } from "../controllers/create-subscription-controller";
import { CreateSubscriptionUseCase } from "@/modules/subscriptions/application/use-cases/create-subscription-usecase";
import { SubscriptionsDrizzleRepository } from "@/modules/subscriptions/infrastucture/repositories/subscriptions-drizzle-repository";
import { drizzleUserRepository } from "@/modules/user/infrastructure/repositories/drizzle-user-repository";
import { db } from "@/shared/infrastructure/db/drizzle/connection-pool";

export async function subscriptionsRoutes(app: FastifyInstance) {
    // Infra
    const subscriptionsRepository = new SubscriptionsDrizzleRepository(
        db
    );

    const userRepository = new drizzleUserRepository(db)

    // Use case
    const createSubscriptionUseCase = new CreateSubscriptionUseCase(
        subscriptionsRepository,
        userRepository
    );

    // Controller
    const createSubscriptionController = new CreateSubscriptionController(
        createSubscriptionUseCase
    );

    // Routes
    app.post(
        "/subscriptions",
        async (request, reply) =>
            createSubscriptionController.handle(request, reply)
    );
}
