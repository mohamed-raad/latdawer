import { z } from 'zod'
import { router, protectedProcedure, publicProcedure } from '@/lib/trpc/server'
import {
  createTransaction, listTransactions, getStoreTransactions,
  createDispute, resolveDispute, listDisputes,
  setPartGuarantee, getPartGuarantee,
  createReferral, completeReferral, getReferralCode,
  recordShare,
  createForumPost, listForumPosts, createForumComment, getForumComments,
  getUserReputation, awardBadge, getUserBadges,
  createDailyDeal, listActiveDeals,
  createPromotion, listActivePromotions,
  updateStoreScore, getStoreScore,
  createSupplier, listSuppliers,
  createWholesaleOrder,
  createCustomerSegment, listCustomerSegments,
  createABTest, listABTests,
} from './services'

export const advancedRouter = router({
  // Transactions
  createTransaction: protectedProcedure
    .input(z.object({
      storeId: z.string(),
      items: z.array(z.object({ partId: z.string(), quantity: z.number(), price: z.number() })),
      totalAmount: z.number(),
      paymentMethod: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => createTransaction(ctx.userId!, input.storeId, input.items, input.totalAmount, input.paymentMethod, input.notes)),

  listTransactions: protectedProcedure.query(async ({ ctx }) => listTransactions(ctx.userId!)),

  getStoreTransactions: protectedProcedure
    .input(z.object({ storeId: z.string() }))
    .query(async ({ input }) => getStoreTransactions(input.storeId)),

  // Disputes
  createDispute: protectedProcedure
    .input(z.object({
      transactionId: z.string(),
      storeId: z.string(),
      reason: z.string(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => createDispute(input.transactionId, ctx.userId!, input.storeId, input.reason, input.description)),

  resolveDispute: protectedProcedure
    .input(z.object({ id: z.string(), resolution: z.string() }))
    .mutation(async ({ input }) => resolveDispute(input.id, input.resolution)),

  listDisputes: protectedProcedure
    .input(z.object({ storeId: z.string().optional() }))
    .query(async ({ input }) => listDisputes(input.storeId)),

  // Money-back Guarantee
  setPartGuarantee: protectedProcedure
    .input(z.object({
      partId: z.string(),
      storeId: z.string(),
      hasGuarantee: z.boolean(),
      guaranteeDays: z.number().optional(),
      guaranteeTerms: z.string().optional(),
    }))
    .mutation(async ({ input }) => setPartGuarantee(input.partId, input.storeId, input.hasGuarantee, input.guaranteeDays, input.guaranteeTerms)),

  getPartGuarantee: publicProcedure
    .input(z.object({ partId: z.string(), storeId: z.string() }))
    .query(async ({ input }) => getPartGuarantee(input.partId, input.storeId)),

  // Referrals
  createReferral: protectedProcedure.mutation(async ({ ctx }) => createReferral(ctx.userId!)),

  getReferralCode: protectedProcedure.query(async ({ ctx }) => getReferralCode(ctx.userId!)),

  completeReferral: protectedProcedure
    .input(z.object({
      code: z.string(),
      referredStoreId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => completeReferral(input.code, ctx.userId, input.referredStoreId)),

  // Social Sharing
  recordShare: protectedProcedure
    .input(z.object({
      entityType: z.string(),
      entityId: z.string(),
      platform: z.string(),
    }))
    .mutation(async ({ ctx, input }) => recordShare(ctx.userId, input.entityType, input.entityId, input.platform)),

  // Forum
  createForumPost: protectedProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
      category: z.string().optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => createForumPost(ctx.userId!, input.title, input.content, input.category, input.tags)),

  listForumPosts: publicProcedure
    .input(z.object({ category: z.string().optional() }))
    .query(async ({ input }) => listForumPosts(input.category)),

  createForumComment: protectedProcedure
    .input(z.object({ postId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => createForumComment(input.postId, ctx.userId!, input.content)),

  getForumComments: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input }) => getForumComments(input.postId)),

  // Reputation
  getUserReputation: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => getUserReputation(input.userId)),

  // Badges
  awardBadge: protectedProcedure
    .input(z.object({ userId: z.string(), badgeType: z.string() }))
    .mutation(async ({ input }) => awardBadge(input.userId, input.badgeType)),

  getUserBadges: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => getUserBadges(input.userId)),

  // Daily Deals
  createDailyDeal: protectedProcedure
    .input(z.object({
      storeId: z.string(),
      partId: z.string(),
      originalPrice: z.number(),
      dealPrice: z.number(),
      quantity: z.number(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .mutation(async ({ input }) => createDailyDeal(input.storeId, input.partId, input.originalPrice, input.dealPrice, input.quantity, input.startDate, input.endDate)),

  listActiveDeals: publicProcedure.query(async () => listActiveDeals()),

  // Promotions
  createPromotion: protectedProcedure
    .input(z.object({
      storeId: z.string().optional(),
      title: z.string(),
      titleAr: z.string(),
      description: z.string().optional(),
      descriptionAr: z.string().optional(),
      discountPercent: z.number(),
      couponCode: z.string().optional(),
      minPurchase: z.number().optional(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .mutation(async ({ input }) => createPromotion(input)),

  listActivePromotions: publicProcedure.query(async () => listActivePromotions()),

  // Store Scores
  updateStoreScore: protectedProcedure
    .input(z.object({
      storeId: z.string(),
      responseTime: z.number().optional(),
      accuracy: z.number().optional(),
      satisfaction: z.number().optional(),
      overallScore: z.number().optional(),
      totalOrders: z.number().optional(),
      completedOrders: z.number().optional(),
      cancelledOrders: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { storeId, ...data } = input
      return updateStoreScore(storeId, data)
    }),

  getStoreScore: publicProcedure
    .input(z.object({ storeId: z.string() }))
    .query(async ({ input }) => getStoreScore(input.storeId)),

  // Suppliers
  createSupplier: protectedProcedure
    .input(z.object({
      name: z.string(),
      nameAr: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      city: z.string().optional(),
      categories: z.string().optional(),
    }))
    .mutation(async ({ input }) => createSupplier(input)),

  listSuppliers: publicProcedure.query(async () => listSuppliers()),

  // Wholesale
  createWholesaleOrder: protectedProcedure
    .input(z.object({
      supplierId: z.string().optional(),
      storeId: z.string().optional(),
      items: z.array(z.object({ partId: z.string(), quantity: z.number(), price: z.number() })),
      totalAmount: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => createWholesaleOrder(ctx.userId!, input.items, input.totalAmount, input.supplierId, input.storeId, input.notes)),

  // Customer Segments
  createCustomerSegment: protectedProcedure
    .input(z.object({ name: z.string(), nameAr: z.string(), criteria: z.string() }))
    .mutation(async ({ input }) => createCustomerSegment(input.name, input.nameAr, input.criteria)),

  listCustomerSegments: protectedProcedure.query(async () => listCustomerSegments()),

  // A/B Testing
  createABTest: protectedProcedure
    .input(z.object({
      name: z.string(),
      variant: z.string(),
      traffic: z.number(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .mutation(async ({ input }) => createABTest(input.name, input.variant, input.traffic, input.startDate, input.endDate)),

  listABTests: protectedProcedure.query(async () => listABTests()),
})