import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { users, stores } from './users'
import { parts } from './catalog'

// Transaction History
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  storeId: text('store_id').notNull().references(() => stores.id),
  items: text('items').notNull(),
  totalAmount: real('totalAmount').notNull(),
  status: text('status').notNull().default('pending'),
  paymentMethod: text('payment_method'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Dispute Resolution
export const disputes = sqliteTable('disputes', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull().references(() => transactions.id),
  userId: text('user_id').notNull().references(() => users.id),
  storeId: text('store_id').notNull().references(() => stores.id),
  reason: text('reason').notNull(),
  description: text('description'),
  status: text('status').notNull().default('open'),
  resolution: text('resolution'),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Money-back Guarantee (per part)
export const partGuarantees = sqliteTable('part_guarantees', {
  id: text('id').primaryKey(),
  partId: text('part_id').notNull().references(() => parts.id),
  storeId: text('store_id').notNull().references(() => stores.id),
  hasGuarantee: integer('has_guarantee', { mode: 'boolean' }).notNull().default(false),
  guaranteeDays: integer('guarantee_days').default(7),
  guaranteeTerms: text('guarantee_terms'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Referral Program
export const referrals = sqliteTable('referrals', {
  id: text('id').primaryKey(),
  referrerUserId: text('referrer_user_id').notNull().references(() => users.id),
  referredUserId: text('referred_user_id').references(() => users.id),
  referredStoreId: text('referred_store_id').references(() => stores.id),
  code: text('code').notNull().unique(),
  status: text('status').notNull().default('pending'),
  rewardPoints: integer('reward_points').default(0),
  discountPercent: real('discount_percent').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Social Sharing
export const socialShares = sqliteTable('social_shares', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  platform: text('platform').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Community Forum
export const forumPosts = sqliteTable('forum_posts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category'),
  tags: text('tags'),
  likes: integer('likes').notNull().default(0),
  views: integer('views').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const forumComments = sqliteTable('forum_comments', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => forumPosts.id),
  userId: text('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  likes: integer('likes').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// User Reputation
export const userReputation = sqliteTable('user_reputation', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id).unique(),
  totalReviews: integer('total_reviews').notNull().default(0),
  totalPurchases: integer('total_purchases').notNull().default(0),
  totalSales: integer('total_sales').notNull().default(0),
  reputationScore: real('reputation_score').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Achievement Badges
export const userBadges = sqliteTable('user_badges', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  badgeType: text('badge_type').notNull(),
  badgeName: text('badge_name').notNull(),
  badgeNameAr: text('badge_name_ar').notNull(),
  description: text('description'),
  earnedAt: integer('earned_at', { mode: 'timestamp' }).notNull(),
})

// Daily Deals
export const dailyDeals = sqliteTable('daily_deals', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id),
  partId: text('part_id').notNull().references(() => parts.id),
  originalPrice: real('original_price').notNull(),
  dealPrice: real('deal_price').notNull(),
  quantity: integer('quantity').notNull().default(1),
  sold: integer('sold').notNull().default(0),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Seasonal Promotions
export const promotions = sqliteTable('promotions', {
  id: text('id').primaryKey(),
  storeId: text('store_id').references(() => stores.id),
  title: text('title').notNull(),
  titleAr: text('title_ar').notNull(),
  description: text('description'),
  descriptionAr: text('description_ar'),
  discountPercent: real('discount_percent').notNull(),
  couponCode: text('coupon_code'),
  minPurchase: real('min_purchase').default(0),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Store Performance Scores
export const storeScores = sqliteTable('store_scores', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id),
  responseTime: real('response_time'),
  accuracy: real('accuracy'),
  satisfaction: real('satisfaction'),
  overallScore: real('overall_score'),
  totalOrders: integer('total_orders').default(0),
  completedOrders: integer('completed_orders').default(0),
  cancelledOrders: integer('cancelled_orders').default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Supplier Network
export const suppliers = sqliteTable('suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  phone: text('phone'),
  email: text('email'),
  city: text('city'),
  categories: text('categories'),
  verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const supplierProducts = sqliteTable('supplier_products', {
  id: text('id').primaryKey(),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id),
  partId: text('part_id').notNull().references(() => parts.id),
  price: real('price').notNull(),
  minQuantity: integer('min_quantity').default(1),
  leadTime: text('lead_time'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Wholesale Portal
export const wholesaleOrders = sqliteTable('wholesale_orders', {
  id: text('id').primaryKey(),
  buyerId: text('buyer_id').notNull().references(() => users.id),
  supplierId: text('supplier_id').references(() => suppliers.id),
  storeId: text('store_id').references(() => stores.id),
  items: text('items').notNull(),
  totalAmount: real('total_amount').notNull(),
  status: text('status').notNull().default('pending'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Customer Segmentation
export const customerSegments = sqliteTable('customer_segments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameAr: text('name_ar').notNull(),
  criteria: text('criteria').notNull(),
  userCount: integer('user_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// A/B Testing
export const abTests = sqliteTable('ab_tests', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  variant: text('variant').notNull(),
  traffic: real('traffic').notNull().default(50),
  conversions: integer('conversions').default(0),
  impressions: integer('impressions').default(0),
  status: text('status').notNull().default('active'),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})