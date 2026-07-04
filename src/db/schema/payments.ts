import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { stores } from './users'

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id),
  subscriptionId: text('subscription_id'),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('IQD'),
  method: text('method').notNull(),
  stripePaymentId: text('stripe_payment_id'),
  stripeSessionId: text('stripe_session_id'),
  status: text('status').notNull().default('pending'),
  metadata: text('metadata'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const paymentsRelations = relations(payments, ({ one }) => ({
  store: one(stores, { fields: [payments.storeId], references: [stores.id] }),
}))
