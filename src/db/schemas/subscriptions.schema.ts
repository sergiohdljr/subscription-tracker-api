import { pgTable, text, timestamp, decimal, varchar, boolean, pgEnum } from 'drizzle-orm/pg-core'
import { user } from './auth.schema'

export const billingCycle = pgEnum('billing_cycle', ['weekly', 'monthly', 'yearly'] as const)

// Application tables
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  billingCycle: billingCycle('billing_cycle').default('monthly').notNull(),
  nextBillingDate: timestamp('next_billing_date').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => new Date())
    .notNull(),
})
