import { FastifyRequest, FastifyReply } from "fastify";
import { CreateSubscriptionUseCase } from "@/modules/subscriptions/application/use-cases/create-subscription-usecase";
import { BadRequestError, UnauthorizedError } from "@/shared/infrastructure/http/errors";
import z from "zod";


export const createSubscriptionSchema = z.object({
    name: z.string().min(1),
    price: z.number().positive(),
    currency: z.string().optional(),
    billingCycle: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]),
    startDate: z.coerce.date(),
    trialEndsAt: z.coerce.date().optional()
});

export class CreateSubscriptionController {
    constructor(
        private readonly createSubscriptionUseCase: CreateSubscriptionUseCase
    ) { }

    async handle(request: FastifyRequest, reply: FastifyReply) {
        const userId = request?.user?.id;

        if (!userId) {
            throw new UnauthorizedError('User not found')
        }

        const parseResult = createSubscriptionSchema.safeParse(request.body);

        if (!parseResult.success) {
            throw new BadRequestError('Invalid request payload', {
                errors: parseResult.error?.flatten().fieldErrors ?? []
            });
        }

        const {
            name,
            price,
            currency,
            billingCycle,
            startDate,
            trialEndsAt
        } = parseResult.data;

        console.log("BILLING_CIRCLE", billingCycle)

        const result = await this.createSubscriptionUseCase.run({
            name,
            price: price.toString(),
            userId,
            billingCycle,
            startDate,
            trialEndsAt,
            currency,
            status: "ACTIVE",
            nextBillingDate: new Date(0),
            lastBillingDate: null,
            renewalNotifiedAt: null,
        });

        return reply.status(201).send({
            id: result.id
        });
    }
}
