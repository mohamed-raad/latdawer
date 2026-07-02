import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '@/lib/trpc/server'
import * as svc from './services'

export const garageRouter = router({
  add: protectedProcedure
    .input(z.object({ vehicleId: z.string().min(1), nickname: z.string().max(100).optional(), licensePlate: z.string().max(50).optional() }))
    .mutation(async ({ input, ctx }) => svc.addVehicle(ctx.userId, input)),

  list: protectedProcedure
    .query(async ({ ctx }) => svc.listUserVehicles(ctx.userId)),

  remove: protectedProcedure
    .input(z.object({ vehicleId: z.string() }))
    .mutation(async ({ input, ctx }) => svc.removeVehicle(ctx.userId, input.vehicleId)),

  parts: publicProcedure
    .input(z.object({ vehicleId: z.string(), page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ input }) => svc.getPartsForVehicle(input.vehicleId, input.page, input.limit)),

  makes: publicProcedure
    .query(async () => svc.listMakes()),

  models: publicProcedure
    .input(z.object({ make: z.string() }))
    .query(async ({ input }) => svc.listModels(input.make)),

  years: publicProcedure
    .input(z.object({ make: z.string(), model: z.string() }))
    .query(async ({ input }) => svc.listYears(input.make, input.model)),
})
