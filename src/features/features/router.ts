import { z } from 'zod'
import { router, protectedProcedure, publicProcedure } from '@/lib/trpc/server'
import {
  createPriceAlert, deletePriceAlert, listPriceAlerts,
  listNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount,
  createAd, listActiveAds, recordAdImpression, recordAdClick,
  addLoyaltyPoints, redeemLoyaltyPoints, getLoyaltyBalance,
  recordBarcodeScan, findPartByBarcode,
} from './services'
import { TRPCError } from '@trpc/server'

const isAdmin = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.role !== 'Admin' && ctx.role !== 'SuperAdmin') {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
  return next()
})

export const featuresRouter = router({
  createPriceAlert: protectedProcedure
    .input(z.object({
      partId: z.string(),
      targetPrice: z.number().optional(),
      storeId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createPriceAlert(ctx.userId!, input.partId, input.targetPrice, input.storeId)
    }),

  deletePriceAlert: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => deletePriceAlert(input.id)),

  listPriceAlerts: protectedProcedure.query(async ({ ctx }) => {
    return listPriceAlerts(ctx.userId!)
  }),

  listNotifications: protectedProcedure
    .input(z.object({ unreadOnly: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      return listNotifications(ctx.userId!, input.unreadOnly)
    }),

  markNotificationRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => markNotificationRead(input.id)),

  markAllNotificationsRead: protectedProcedure.mutation(async ({ ctx }) => {
    return markAllNotificationsRead(ctx.userId!)
  }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return getUnreadCount(ctx.userId!)
  }),

  createAd: isAdmin
    .input(z.object({
      storeId: z.string(),
      title: z.string().min(1),
      titleAr: z.string().min(1),
      description: z.string().optional(),
      descriptionAr: z.string().optional(),
      imageUrl: z.string().optional(),
      targetQuery: z.string().optional(),
      targetCategory: z.string().optional(),
      budget: z.number().positive(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .mutation(async ({ input }) => createAd(input)),

  listActiveAds: publicProcedure
    .input(z.object({
      targetQuery: z.string().optional(),
      targetCategory: z.string().optional(),
    }))
    .query(async ({ input }) => listActiveAds(input.targetQuery, input.targetCategory)),

  recordAdImpression: publicProcedure
    .input(z.object({ adId: z.string() }))
    .mutation(async ({ input }) => recordAdImpression(input.adId)),

  recordAdClick: publicProcedure
    .input(z.object({ adId: z.string() }))
    .mutation(async ({ input }) => recordAdClick(input.adId)),

  addLoyaltyPoints: protectedProcedure
    .input(z.object({
      points: z.number().positive(),
      description: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return addLoyaltyPoints(ctx.userId!, input.points, input.description)
    }),

  redeemLoyaltyPoints: protectedProcedure
    .input(z.object({
      points: z.number().positive(),
      description: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return redeemLoyaltyPoints(ctx.userId!, input.points, input.description)
    }),

  getLoyaltyBalance: protectedProcedure.query(async ({ ctx }) => {
    return getLoyaltyBalance(ctx.userId!)
  }),

  scanBarcode: protectedProcedure
    .input(z.object({ barcode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const part = await findPartByBarcode(input.barcode)
      await recordBarcodeScan(ctx.userId, input.barcode, part?.id)
      return { part, barcode: input.barcode }
    }),

  findPartByBarcode: publicProcedure
    .input(z.object({ barcode: z.string() }))
    .query(async ({ input }) => findPartByBarcode(input.barcode)),
})