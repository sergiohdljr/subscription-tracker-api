import { ListSubscriptionsUseCase } from "@/modules/subscriptions/application/use-cases/list-subscriptions";
import { FastifyReply, FastifyRequest } from "fastify";

export class ListSubscriptionsController {
    constructor(
        private readonly listSubscriptionUseCase: ListSubscriptionsUseCase
    ) { }

    async handle(request: FastifyRequest, reply: FastifyReply) {

        const userId = request.user?.id

        if (!userId) {
            return reply.status(401).send({
                message: 'user not found'
            })
        }

        try {
            const subscriptions = await this.listSubscriptionUseCase.run(userId)
            return reply.status(200).send(subscriptions)
        } catch (error) {
            return reply.status(500).send({
                message: error
            })
        }
    }
}