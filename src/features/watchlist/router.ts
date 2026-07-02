import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc/server'
import { checkWatchlist, addToWatchlist, removeFromWatchlist } from './services'

export const watchlistRouter = router({
  check: protectedProcedure
    .input(z.object({ partId: z.string() }))
    .query(async ({ input, ctx }) => checkWatchlist(ctx.userId, input.partId)),
  add: protectedProcedure
    .input(z.object({ partId: z.string() }))
    .mutation(async ({ input, ctx }) => addToWatchlist(ctx.userId, input.partId)),
  remove: protectedProcedure
    .input(z.object({ partId: z.string() }))
    .mutation(async ({ input, ctx }) => removeFromWatchlist(ctx.userId, input.partId)),
})
