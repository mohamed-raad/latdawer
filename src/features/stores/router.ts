import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '@/lib/trpc/server'
import { createStoreSchema, updateStoreSchema } from './validators'
import { listStores, getStore, createNewStore, editStore, getMyStore } from './services'
import { db } from '@/db'
import { stores } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const storesRouter = router({
  list: publicProcedure
    .query(async () => listStores({})),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => getStore(input.id)),

  myStore: protectedProcedure
    .query(async ({ ctx }) => getMyStore(ctx.userId)),

  create: protectedProcedure
    .input(createStoreSchema)
    .mutation(async ({ input, ctx }) => createNewStore(input, ctx.userId)),

  update: protectedProcedure
    .input(updateStoreSchema.extend({ id: z.string() }))
    .mutation(async ({ input, ctx }) => editStore(input.id, input, ctx.userId)),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.role !== 'Admin' && ctx.role !== 'SuperAdmin') {
        const [store] = await db.select().from(stores).where(eq(stores.id, input.id))
        if (!store || store.ownerId !== ctx.userId) {
          throw new Error('Unauthorized')
        }
      }
      await db.delete(stores).where(eq(stores.id, input.id))
      return { success: true }
    }),
})
