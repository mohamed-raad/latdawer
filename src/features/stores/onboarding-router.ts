import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc/server'
import { db } from '@/db'
import { storeManufacturers, storeVehicles, storeCategories } from '@/db/schema/store-specializations'
import { manufacturers } from '@/db/schema/catalog'
import { vehicles } from '@/db/schema/vehicles'
import { categories } from '@/db/schema/catalog'
import { stores } from '@/db/schema/users'
import { eq, inArray } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

export const onboardingRouter = router({
  // Get store's current specializations
  getStoreSpecializations: protectedProcedure.query(async ({ ctx }) => {
    const [store] = await db.select().from(stores).where(eq(stores.ownerId, ctx.userId!))
    if (!store) throw new TRPCError({ code: 'NOT_FOUND', message: 'المتجر غير موجود' })

    const mfrs = await db.select().from(storeManufacturers).where(eq(storeManufacturers.storeId, store.id))
    const vehs = await db.select().from(storeVehicles).where(eq(storeVehicles.storeId, store.id))
    const cats = await db.select().from(storeCategories).where(eq(storeCategories.storeId, store.id))

    return { storeId: store.id, manufacturers: mfrs, vehicles: vehs, categories: cats }
  }),

  // Step 1: Save selected manufacturers
  saveManufacturers: protectedProcedure
    .input(z.object({ manufacturerIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const [store] = await db.select().from(stores).where(eq(stores.ownerId, ctx.userId!))
      if (!store) throw new TRPCError({ code: 'NOT_FOUND', message: 'المتجر غير موجود' })

      // Delete existing
      await db.delete(storeManufacturers).where(eq(storeManufacturers.storeId, store.id))

      // Insert new
      if (input.manufacturerIds.length > 0) {
        await db.insert(storeManufacturers).values(
          input.manufacturerIds.map((mfrId) => ({
            id: crypto.randomUUID(),
            storeId: store.id,
            manufacturerId: mfrId,
            createdAt: new Date(),
          }))
        )
      }

      return { success: true, count: input.manufacturerIds.length }
    }),

  // Step 2: Save selected vehicles
  saveVehicles: protectedProcedure
    .input(z.object({ vehicleIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const [store] = await db.select().from(stores).where(eq(stores.ownerId, ctx.userId!))
      if (!store) throw new TRPCError({ code: 'NOT_FOUND', message: 'المتجر غير موجود' })

      await db.delete(storeVehicles).where(eq(storeVehicles.storeId, store.id))

      if (input.vehicleIds.length > 0) {
        await db.insert(storeVehicles).values(
          input.vehicleIds.map((vehId) => ({
            id: crypto.randomUUID(),
            storeId: store.id,
            vehicleId: vehId,
            createdAt: new Date(),
          }))
        )
      }

      return { success: true, count: input.vehicleIds.length }
    }),

  // Step 3: Save selected categories
  saveCategories: protectedProcedure
    .input(z.object({
      categories: z.array(z.object({
        categoryId: z.string(),
        vehicleId: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const [store] = await db.select().from(stores).where(eq(stores.ownerId, ctx.userId!))
      if (!store) throw new TRPCError({ code: 'NOT_FOUND', message: 'المتجر غير موجود' })

      await db.delete(storeCategories).where(eq(storeCategories.storeId, store.id))

      if (input.categories.length > 0) {
        await db.insert(storeCategories).values(
          input.categories.map((cat) => ({
            id: crypto.randomUUID(),
            storeId: store.id,
            categoryId: cat.categoryId,
            vehicleId: cat.vehicleId || null,
            createdAt: new Date(),
          }))
        )
      }

      return { success: true, count: input.categories.length }
    }),

  // Get all manufacturers
  getManufacturers: protectedProcedure.query(async () => {
    return db.select().from(manufacturers)
  }),

  // Get vehicles by manufacturer IDs
  getVehiclesByManufacturers: protectedProcedure
    .input(z.object({ manufacturerIds: z.array(z.string()) }))
    .query(async ({ input }) => {
      if (input.manufacturerIds.length === 0) return []
      const vehiclesList = await db.select().from(vehicles).where(
        inArray(vehicles.make, input.manufacturerIds.map(id => id))
      )
      return vehiclesList
    }),

  // Get all categories (main + sub)
  getCategories: protectedProcedure.query(async () => {
    return db.select().from(categories)
  }),

  // Get vehicles by make name
  getVehiclesByMake: protectedProcedure
    .input(z.object({ make: z.string() }))
    .query(async ({ input }) => {
      return db.select().from(vehicles).where(eq(vehicles.make, input.make))
    }),
})
