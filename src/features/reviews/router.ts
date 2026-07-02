import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '@/lib/trpc/server'
import { getStoreRating, getStoreReviews, createReview, hasUserReviewed } from './services'

export const reviewsRouter = router({
  rating: publicProcedure
    .input(z.object({ storeId: z.string() }))
    .query(async ({ input }) => getStoreRating(input.storeId)),
  list: publicProcedure
    .input(z.object({ storeId: z.string(), page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ input }) => getStoreReviews(input.storeId, input.page, input.limit)),
  create: protectedProcedure
    .input(z.object({ storeId: z.string(), rating: z.number().int().min(1).max(5), comment: z.string().max(1000).optional() }))
    .mutation(async ({ input, ctx }) => createReview(ctx.userId, input.storeId, input.rating, input.comment)),
  hasReviewed: protectedProcedure
    .input(z.object({ storeId: z.string() }))
    .query(async ({ input, ctx }) => hasUserReviewed(ctx.userId, input.storeId)),
})
