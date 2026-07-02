import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'
import { users, stores } from './users'
import { parts } from './catalog'
import { vehicles } from './vehicles'

export const searchHistory = sqliteTable('search_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  query: text('query').notNull(),
  filters: text('filters'),
  resultsCount: text('results_count'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  details: text('details'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  storeId: text('store_id'),
  plan: text('plan').notNull().default('free'),
  status: text('status').notNull().default('active'),
  paymentMethod: text('payment_method'),
  amount: real('amount'),
  discount: real('discount').default(0),
  startsAt: integer('starts_at', { mode: 'timestamp' }).notNull(),
  endsAt: integer('ends_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const analytics = sqliteTable('analytics', {
  id: text('id').primaryKey(),
  event: text('event').notNull(),
  metadata: text('metadata'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const partAlternatives = sqliteTable('part_alternatives', {
  id: text('id').primaryKey(),
  partId: text('part_id').notNull().references(() => parts.id),
  altPartId: text('alt_part_id').notNull().references(() => parts.id),
  type: text('type').notNull().default('equivalent'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const watchlist = sqliteTable('watchlist', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  partId: text('part_id').notNull().references(() => parts.id),
  maxPrice: real('max_price'),
  notified: integer('notified', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  storeId: text('store_id').notNull().references(() => stores.id),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const partRequests = sqliteTable('part_requests', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  partNumber: text('part_number'),
  vehicleMake: text('vehicle_make'),
  vehicleModel: text('vehicle_model'),
  vehicleYear: text('vehicle_year'),
  city: text('city'),
  status: text('status').notNull().default('open'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const requestOffers = sqliteTable('request_offers', {
  id: text('id').primaryKey(),
  requestId: text('request_id').notNull().references(() => partRequests.id),
  storeId: text('store_id').notNull().references(() => stores.id),
  price: real('price'),
  notes: text('notes'),
  status: text('status').notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const userVehicles = sqliteTable('user_vehicles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  nickname: text('nickname'),
  licensePlate: text('license_plate'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const workflows = sqliteTable('workflows', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameAr: text('name_ar').notNull(),
  description: text('description'),
  descriptionAr: text('description_ar'),
  triggerType: text('trigger_type').notNull(),
  triggerConfig: text('trigger_config'),
  actions: text('actions').notNull(),
  conditions: text('conditions'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const workflowRuns = sqliteTable('workflow_runs', {
  id: text('id').primaryKey(),
  workflowId: text('workflow_id').notNull().references(() => workflows.id),
  storeId: text('store_id').references(() => stores.id),
  status: text('status').notNull().default('pending'),
  input: text('input'),
  output: text('output'),
  error: text('error'),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
}, (table) => ({
  storeIdIdx: index('workflow_runs_store_idx').on(table.storeId),
  workflowIdIdx: index('workflow_runs_workflow_idx').on(table.workflowId),
  statusIdx: index('workflow_runs_status_idx').on(table.status),
}))

export const storeAutomations = sqliteTable('store_automations', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id),
  workflowId: text('workflow_id').notNull().references(() => workflows.id),
  maxPricePerAction: real('max_price_per_action'),
  maxActionsPerDay: integer('max_actions_per_day').default(100),
  planRequired: text('plan_required').default('free'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  lastRunAt: integer('last_run_at', { mode: 'timestamp' }),
  runCount: integer('run_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  storeIdIdx: index('store_automations_store_idx').on(table.storeId),
  workflowIdIdx: index('store_automations_workflow_idx').on(table.workflowId),
}))
