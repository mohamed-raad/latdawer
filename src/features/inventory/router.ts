import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '@/lib/trpc/server'
import { createInventorySchema, updateInventorySchema, inventoryQuerySchema } from './validators'
import {
  listInventory,
  addInventory,
  editInventory,
  removeInventory,
  getInventoryDetails,
  getInventoryForPart,
  comparePrices,
} from './services'

export const inventoryRouter = router({
  list: publicProcedure
    .input(inventoryQuerySchema)
    .query(async ({ input }) => listInventory(input)),

  byPart: publicProcedure
    .input(z.object({ partId: z.string() }))
    .query(async ({ input }) => getInventoryForPart(input.partId)),

  compare: publicProcedure
    .input(z.object({ partId: z.string() }))
    .query(async ({ input }) => comparePrices(input.partId)),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => getInventoryDetails(input.id)),

  create: protectedProcedure
    .input(createInventorySchema)
    .mutation(async ({ input, ctx }) => addInventory(input, ctx.userId)),

  update: protectedProcedure
    .input(updateInventorySchema.extend({ id: z.string() }))
    .mutation(async ({ input, ctx }) => editInventory(input.id, input, ctx.userId)),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => removeInventory(input.id, ctx.userId)),
})
