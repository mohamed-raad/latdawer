import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { users, stores } from './users'
import { parts } from './catalog'

export const priceAlerts = sqliteTable('price_alerts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  partId: text('part_id').notNull().references(() => parts.id),
  storeId: text('store_id').references(() => stores.id),
  targetPrice: real('target_price'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  lastNotifiedAt: integer('last_notified_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const storeAds = sqliteTable('store_ads', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id),
  title: text('title').notNull(),
  titleAr: text('title_ar').notNull(),
  description: text('description'),
  descriptionAr: text('description_ar'),
  imageUrl: text('image_url'),
  targetQuery: text('target_query'),
  targetCategory: text('target_category'),
  budget: real('budget').notNull(),
  spent: real('spent').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  impressions: integer('impressions').notNull().default(0),
  status: text('status').notNull().default('active'),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  titleAr: text('title_ar').notNull(),
  message: text('message').notNull(),
  messageAr: text('message_ar').notNull(),
  data: text('data'),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const loyaltyPoints = sqliteTable('loyalty_points', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  points: integer('points').notNull().default(0),
  totalEarned: integer('total_earned').notNull().default(0),
  totalRedeemed: integer('total_redeemed').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const loyaltyTransactions = sqliteTable('loyalty_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  points: integer('points').notNull(),
  type: text('type').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const barcodeScans = sqliteTable('barcode_scans', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  barcode: text('barcode').notNull(),
  partId: text('part_id').references(() => parts.id),
  scannedAt: integer('scanned_at', { mode: 'timestamp' }).notNull(),
})