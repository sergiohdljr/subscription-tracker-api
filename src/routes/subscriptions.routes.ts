import { FastifyInstance } from 'fastify';
import { SubscriptionController } from '../modules/subscriptions/subscription.controller';

export async function subscriptionsRoutes(
    server: FastifyInstance,
    controller: SubscriptionController,
) {
    server.get('/subscriptions', {
        schema: {
            tags: ['Subscriptions'],
            description: 'Get all subscriptions for the authenticated user',
            security: [{ cookieAuth: [] }],
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'number' },
                            userId: { type: 'string' },
                            name: { type: 'string' },
                            price: { type: 'string' },
                            billingCycle: {
                                type: 'string',
                                enum: ['weekly', 'monthly', 'yearly']
                            },
                            nextBillingDate: { type: 'string', format: 'date-time' },
                            active: { type: 'boolean' },
                        },
                    },
                },
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
                404: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
            },
        },
    }, controller.findAll.bind(controller));
}

