import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc/server'
import { createDispute, getDispute, listUserDisputes, resolveDispute } from './services'
import { TRPCError } from '@trpc/server'

export const disputesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listUserDisputes(ctx.userId!)
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await getDispute(input.id)
      if (!result || result.dispute.userId !== ctx.userId) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      return result
    }),

  create: protectedProcedure
    .input(z.object({
      transactionId: z.string(),
      storeId: z.string(),
      reason: z.string().min(3),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createDispute({
        ...input,
        userId: ctx.userId!,
      })
    }),

  resolve: protectedProcedure
    .input(z.object({
      id: z.string(),
      resolution: z.string().min(3),
    }))
    .mutation(async ({ input }) => {
      const result = await resolveDispute(input.id, input.resolution)
      if (!result) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      return result
    }),
})
