import { FastifyReply, FastifyRequest } from "fastify";
import { FindAllSubscriptionsUseCase } from "./use-cases/find-all-subscriptions";

export class SubscriptionController {
    constructor(private readonly findAllSubscriptionsUseCase: FindAllSubscriptionsUseCase) {
    }

    async findAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = request.user?.id;

            if (!userId) {
                return reply.status(401).send({
                    error: 'Unauthorized'
                });
            }

            const subscriptions = await this.findAllSubscriptionsUseCase.run(userId);

            return reply.status(200).send(subscriptions);
        } catch (error) {
            if (error instanceof Error && error.message === "User not found") {
                return reply.status(404).send({
                    error: error.message
                });
            }

            return reply.status(500).send({
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    }
}

