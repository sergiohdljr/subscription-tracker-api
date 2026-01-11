import { pgTable, text, timestamp, decimal, varchar, pgEnum, serial } from 'drizzle-orm/pg-core'
import { user } from './auth.schema'

export const billingCycle = pgEnum('billing_cycle', ['WEEKLY', 'MONTHLY', 'YEARLY'] as const)
export const subscriptionStatus = pgEnum('subscription_status', ['ACTIVE', 'INACTIVE', 'TRIAL'] as const)

// Application tables
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 })
    .default('BRL')
    .notNull(),
  billingCycle: billingCycle('billing_cycle')
    .notNull(),
  status: subscriptionStatus('status')
    .default('ACTIVE')
    .notNull(),
  startDate: timestamp('start_date').notNull(),
  nextBillingDate: timestamp('next_billing_date').notNull(),
  lastBillingDate: timestamp('last_billing_date'),
  renewalNotifiedAt: timestamp('renewal_notified_at'),
  trialEndsAt: timestamp('trial_ends_at'),
  createdAt: timestamp('created_at')
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => new Date())
    .notNull(),
});

