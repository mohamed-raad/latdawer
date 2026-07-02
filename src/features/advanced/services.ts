import { db } from '@/db'
import {
  transactions, disputes, partGuarantees, referrals, socialShares,
  forumPosts, forumComments, userReputation, userBadges, dailyDeals,
  promotions, storeScores, suppliers, wholesaleOrders,
  customerSegments, abTests
} from '@/db/schema'
import { eq, and, sql, desc, gte } from 'drizzle-orm'
import crypto from 'crypto'

// Transaction History
export async function createTransaction(userId: string, storeId: string, items: Array<{ partId: string; quantity: number; price: number }>, totalAmount: number, paymentMethod?: string, notes?: string) {
  const [transaction] = await db.insert(transactions).values({
    id: crypto.randomUUID(),
    userId,
    storeId,
    items: JSON.stringify(items),
    totalAmount,
    status: 'completed',
    paymentMethod,
    notes,
    createdAt: new Date(),
  }).returning()
  return transaction
}

export async function listTransactions(userId: string) {
  return db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt))
}

export async function getStoreTransactions(storeId: string) {
  return db.select().from(transactions).where(eq(transactions.storeId, storeId)).orderBy(desc(transactions.createdAt))
}

// Dispute Resolution
export async function createDispute(transactionId: string, userId: string, storeId: string, reason: string, description?: string) {
  const [dispute] = await db.insert(disputes).values({
    id: crypto.randomUUID(),
    transactionId,
    userId,
    storeId,
    reason,
    description,
    status: 'open',
    createdAt: new Date(),
  }).returning()
  return dispute
}

export async function resolveDispute(id: string, resolution: string) {
  const [dispute] = await db.update(disputes)
    .set({ status: 'resolved', resolution, resolvedAt: new Date() })
    .where(eq(disputes.id, id))
    .returning()
  return dispute
}

export async function listDisputes(storeId?: string) {
  if (storeId) {
    return db.select().from(disputes).where(eq(disputes.storeId, storeId)).orderBy(desc(disputes.createdAt))
  }
  return db.select().from(disputes).orderBy(desc(disputes.createdAt))
}

// Money-back Guarantee
export async function setPartGuarantee(partId: string, storeId: string, hasGuarantee: boolean, guaranteeDays?: number, guaranteeTerms?: string) {
  const [guarantee] = await db.insert(partGuarantees).values({
    id: crypto.randomUUID(),
    partId,
    storeId,
    hasGuarantee,
    guaranteeDays,
    guaranteeTerms,
    createdAt: new Date(),
  }).returning()
  return guarantee
}

export async function getPartGuarantee(partId: string, storeId: string) {
  const [guarantee] = await db.select().from(partGuarantees)
    .where(and(eq(partGuarantees.partId, partId), eq(partGuarantees.storeId, storeId)))
  return guarantee
}

// Referral Program
export async function createReferral(referrerUserId: string) {
  const code = `REF${crypto.randomBytes(4).toString('hex').toUpperCase()}`
  const [referral] = await db.insert(referrals).values({
    id: crypto.randomUUID(),
    referrerUserId,
    code,
    status: 'pending',
    rewardPoints: 100,
    discountPercent: 5,
    createdAt: new Date(),
  }).returning()
  return referral
}

export async function completeReferral(code: string, referredUserId?: string, referredStoreId?: string) {
  const [referral] = await db.update(referrals)
    .set({
      status: 'completed',
      referredUserId,
      referredStoreId,
    })
    .where(eq(referrals.code, code))
    .returning()
  return referral
}

export async function getReferralCode(userId: string) {
  const [referral] = await db.select().from(referrals).where(eq(referrals.referrerUserId, userId))
  return referral
}

// Social Sharing
export async function recordShare(userId: string | undefined, entityType: string, entityId: string, platform: string) {
  const [share] = await db.insert(socialShares).values({
    id: crypto.randomUUID(),
    userId,
    entityType,
    entityId,
    platform,
    createdAt: new Date(),
  }).returning()
  return share
}

// Community Forum
export async function createForumPost(userId: string, title: string, content: string, category?: string, tags?: string) {
  const [post] = await db.insert(forumPosts).values({
    id: crypto.randomUUID(),
    userId,
    title,
    content,
    category,
    tags,
    createdAt: new Date(),
  }).returning()
  return post
}

export async function listForumPosts(category?: string, limit = 20) {
  const conditions = []
  if (category) conditions.push(eq(forumPosts.category, category))

  if (conditions.length > 0) {
    return db.select().from(forumPosts).where(and(...conditions)).orderBy(desc(forumPosts.createdAt)).limit(limit)
  }
  return db.select().from(forumPosts).orderBy(desc(forumPosts.createdAt)).limit(limit)
}

export async function createForumComment(postId: string, userId: string, content: string) {
  const [comment] = await db.insert(forumComments).values({
    id: crypto.randomUUID(),
    postId,
    userId,
    content,
    createdAt: new Date(),
  }).returning()
  return comment
}

export async function getForumComments(postId: string) {
  return db.select().from(forumComments).where(eq(forumComments.postId, postId)).orderBy(forumComments.createdAt)
}

// User Reputation
export async function getUserReputation(userId: string) {
  const [rep] = await db.select().from(userReputation).where(eq(userReputation.userId, userId))
  return rep
}

export async function updateUserReputation(userId: string, data: Partial<{ totalReviews: number; totalPurchases: number; totalSales: number; reputationScore: number }>) {
  const [rep] = await db.update(userReputation).set(data).where(eq(userReputation.userId, userId)).returning()
  return rep
}

// Achievement Badges
export const BADGE_TYPES = {
  FIRST_PURCHASE: { name: 'First Purchase', nameAr: 'أول شراء', description: 'Complete your first purchase' },
  TOP_REVIEWER: { name: 'Top Reviewer', nameAr: 'مقيّم ممتاز', description: 'Write 10 reviews' },
  EXPERT: { name: 'Expert', nameAr: 'خبير', description: 'Help 50 users in the forum' },
  REFERRER: { name: 'Referrer', nameAr: 'مُحيل', description: 'Refer 5 friends' },
  SPEED_SELLER: { name: 'Speed Seller', nameAr: 'بائع سريع', description: 'Complete 10 orders in a week' },
  TRUSTED: { name: 'Trusted', nameAr: 'موثوق', description: 'Maintain 4.5+ rating for 3 months' },
}

export async function awardBadge(userId: string, badgeType: string) {
  const badge = BADGE_TYPES[badgeType as keyof typeof BADGE_TYPES]
  if (!badge) return null

  const [existing] = await db.select().from(userBadges)
    .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeType, badgeType)))

  if (existing) return existing

  const [newBadge] = await db.insert(userBadges).values({
    id: crypto.randomUUID(),
    userId,
    badgeType,
    badgeName: badge.name,
    badgeNameAr: badge.nameAr,
    description: badge.description,
    earnedAt: new Date(),
  }).returning()
  return newBadge
}

export async function getUserBadges(userId: string) {
  return db.select().from(userBadges).where(eq(userBadges.userId, userId)).orderBy(desc(userBadges.earnedAt))
}

// Daily Deals
export async function createDailyDeal(storeId: string, partId: string, originalPrice: number, dealPrice: number, quantity: number, startDate: Date, endDate: Date) {
  const [deal] = await db.insert(dailyDeals).values({
    id: crypto.randomUUID(),
    storeId,
    partId,
    originalPrice,
    dealPrice,
    quantity,
    startDate,
    endDate,
    createdAt: new Date(),
  }).returning()
  return deal
}

export async function listActiveDeals() {
  const now = new Date()
  return db.select().from(dailyDeals)
    .where(and(gte(dailyDeals.endDate, now), sql`${dailyDeals.sold} < ${dailyDeals.quantity}`))
    .orderBy(desc(dailyDeals.dealPrice))
}

// Seasonal Promotions
export async function createPromotion(data: {
  storeId?: string
  title: string
  titleAr: string
  description?: string
  descriptionAr?: string
  discountPercent: number
  couponCode?: string
  minPurchase?: number
  startDate: Date
  endDate: Date
}) {
  const [promo] = await db.insert(promotions).values({
    id: crypto.randomUUID(),
    ...data,
    status: 'active',
    createdAt: new Date(),
  }).returning()
  return promo
}

export async function listActivePromotions() {
  const now = new Date()
  return db.select().from(promotions)
    .where(and(eq(promotions.status, 'active'), gte(promotions.endDate, now)))
    .orderBy(desc(promotions.discountPercent))
}

// Store Performance Scores
export async function updateStoreScore(storeId: string, data: Partial<{ responseTime: number; accuracy: number; satisfaction: number; overallScore: number; totalOrders: number; completedOrders: number; cancelledOrders: number }>) {
  const [existing] = await db.select().from(storeScores).where(eq(storeScores.storeId, storeId))

  if (existing) {
    const [score] = await db.update(storeScores).set({ ...data, updatedAt: new Date() }).where(eq(storeScores.storeId, storeId)).returning()
    return score
  } else {
    const [score] = await db.insert(storeScores).values({
      id: crypto.randomUUID(),
      storeId,
      ...data,
      updatedAt: new Date(),
    }).returning()
    return score
  }
}

export async function getStoreScore(storeId: string) {
  const [score] = await db.select().from(storeScores).where(eq(storeScores.storeId, storeId))
  return score
}

// Supplier Network
export async function createSupplier(data: { name: string; nameAr?: string; phone?: string; email?: string; city?: string; categories?: string }) {
  const [supplier] = await db.insert(suppliers).values({
    id: crypto.randomUUID(),
    ...data,
    verified: false,
    createdAt: new Date(),
  }).returning()
  return supplier
}

export async function listSuppliers() {
  return db.select().from(suppliers).orderBy(desc(suppliers.createdAt))
}

// Wholesale Portal
export async function createWholesaleOrder(buyerId: string, items: Array<{ partId: string; quantity: number; price: number }>, totalAmount: number, supplierId?: string, storeId?: string, notes?: string) {
  const [order] = await db.insert(wholesaleOrders).values({
    id: crypto.randomUUID(),
    buyerId,
    supplierId,
    storeId,
    items: JSON.stringify(items),
    totalAmount,
    status: 'pending',
    notes,
    createdAt: new Date(),
  }).returning()
  return order
}

// Customer Segmentation
export async function createCustomerSegment(name: string, nameAr: string, criteria: string) {
  const [segment] = await db.insert(customerSegments).values({
    id: crypto.randomUUID(),
    name,
    nameAr,
    criteria,
    createdAt: new Date(),
  }).returning()
  return segment
}

export async function listCustomerSegments() {
  return db.select().from(customerSegments)
}

// A/B Testing
export async function createABTest(name: string, variant: string, traffic: number, startDate: Date, endDate: Date) {
  const [test] = await db.insert(abTests).values({
    id: crypto.randomUUID(),
    name,
    variant,
    traffic,
    startDate,
    endDate,
    status: 'active',
    createdAt: new Date(),
  }).returning()
  return test
}

export async function listABTests() {
  return db.select().from(abTests).orderBy(desc(abTests.createdAt))
}