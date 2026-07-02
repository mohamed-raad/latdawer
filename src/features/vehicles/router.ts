import { z } from 'zod'
import { router, publicProcedure } from '@/lib/trpc/server'
import {
  listMakes,
  listModels,
  listYears,
  findPartsByVehicle,
  findVehiclesByPart,
  searchVehiclesService,
} from './services'

export const vehiclesRouter = router({
  makes: publicProcedure.query(async () => listMakes()),

  models: publicProcedure
    .input(z.object({ make: z.string() }))
    .query(async ({ input }) => listModels(input.make)),

  years: publicProcedure
    .input(z.object({ make: z.string(), model: z.string() }))
    .query(async ({ input }) => listYears(input.make, input.model)),

  partsByVehicle: publicProcedure
    .input(z.object({ vehicleId: z.string() }))
    .query(async ({ input }) => findPartsByVehicle(input.vehicleId)),

  vehiclesByPart: publicProcedure
    .input(z.object({ partId: z.string() }))
    .query(async ({ input }) => findVehiclesByPart(input.partId)),

  search: publicProcedure
    .input(z.object({ q: z.string() }))
    .query(async ({ input }) => searchVehiclesService(input.q)),
})
