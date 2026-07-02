import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '@/lib/trpc/server'
import { getPartDetails, getPartByNumber } from './services'
import { createPart } from './repository'

export const partsRouter = router({
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => getPartDetails(input.id)),

  byNumber: publicProcedure
    .input(z.object({ partNumber: z.string() }))
    .query(async ({ input }) => getPartByNumber(input.partNumber)),

  create: protectedProcedure
    .input(z.object({
      nameAr: z.string(),
      nameEn: z.string().optional(),
      partNumber: z.string().optional(),
      oemNumber: z.string().optional(),
      categoryId: z.string().optional(),
      manufacturerId: z.string().optional(),
      brand: z.string().optional(),
      origin: z.string().optional(),
      condition: z.string().optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const now = new Date()
      return createPart({
        id: crypto.randomUUID(),
        nameAr: input.nameAr,
        nameEn: input.nameEn || input.nameAr,
        partNumber: input.partNumber || null,
        oemNumber: input.oemNumber || null,
        categoryId: input.categoryId || null,
        manufacturerId: input.manufacturerId || null,
        brand: input.brand || null,
        origin: input.origin || null,
        condition: input.condition || 'new',
        tags: input.tags || null,
        createdAt: now,
        updatedAt: now,
      })
    }),
})
