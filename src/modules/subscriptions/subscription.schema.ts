import { z } from 'zod'

const SubscriptionSchema = z.object({
  id: z.number(),
  userId: z.string(),
  name: z.string(),
  price: z.string(),
  billingCycle: z.enum(['weekly', 'monthly', 'yearly']).default('monthly'),
  nextBillingDate: z.date(),
  active: z.boolean().default(true),
})

export type Subscription = z.infer<typeof SubscriptionSchema>
export type CreateSubscription = Omit<Subscription, 'id'>
export type UpdateSubscription = Partial<Subscription>