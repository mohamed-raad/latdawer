import { router, publicProcedure } from '@/lib/trpc/server'
import { searchQuerySchema } from './validators'
import { searchAll, searchPartsService, getCategoriesService, getManufacturersService } from './services'

export const searchRouter = router({
  all: publicProcedure
    .input(searchQuerySchema)
    .query(async ({ input, ctx }) => searchAll(input, ctx.userId ?? undefined)),

  parts: publicProcedure
    .input(searchQuerySchema)
    .query(async ({ input }) => searchPartsService(input)),

  categories: publicProcedure
    .query(async () => getCategoriesService()),

  manufacturers: publicProcedure
    .query(async () => getManufacturersService()),
})
