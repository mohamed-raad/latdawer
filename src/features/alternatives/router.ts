import { z } from 'zod'
import { router, publicProcedure } from '@/lib/trpc/server'
import { addAlternativeSchema } from './validators'
import { listAlternatives, createAlternative, searchByBrand } from './services'

export const alternativesRouter = router({
  byPart: publicProcedure
    .input(z.object({ partId: z.string() }))
    .query(async ({ input }) => listAlternatives(input.partId)),

  search: publicProcedure
    .input(z.object({ q: z.string() }))
    .query(async ({ input }) => searchByBrand(input.q)),

  create: publicProcedure
    .input(addAlternativeSchema)
    .mutation(async ({ input }) => createAlternative(input)),
})
