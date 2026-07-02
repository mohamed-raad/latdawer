import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc/server'
import { listUserTransactions, getTransaction, getTransactionStats } from './services'
import { TRPCError } from '@trpc/server'

export const transactionsRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().min(1).max(50).optional(),
      offset: z.number().min(0).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return listUserTransactions(ctx.userId!, {
        status: input.status,
        limit: input.limit,
        offset: input.offset,
      })
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await getTransaction(input.id)
      if (!result || result.transaction.userId !== ctx.userId) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      return result
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    return getTransactionStats(ctx.userId!)
  }),
})
