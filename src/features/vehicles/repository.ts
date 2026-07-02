import { db } from '@/db'
import { vehicles, compatibility, parts } from '@/db/schema'
import { eq, ilike, or, and } from 'drizzle-orm'

export async function getVehicleMakes() {
  const result = await db
    .select({ make: vehicles.make, makeAr: vehicles.makeAr })
    .from(vehicles)
    .groupBy(vehicles.make, vehicles.makeAr)
  return result
}

export async function getVehicleModels(make: string) {
  const result = await db
    .select({ model: vehicles.model, modelAr: vehicles.modelAr })
    .from(vehicles)
    .where(eq(vehicles.make, make))
    .groupBy(vehicles.model, vehicles.modelAr)
  return result
}

export async function getVehicleYears(make: string, model: string) {
  return db
    .select({ year: vehicles.year })
    .from(vehicles)
    .where(and(eq(vehicles.make, make), eq(vehicles.model, model)))
    .groupBy(vehicles.year)
    .orderBy(vehicles.year)
}

export async function getPartsByVehicle(vehicleId: string) {
  return db
    .select()
    .from(compatibility)
    .where(eq(compatibility.vehicleId, vehicleId))
    .innerJoin(parts, eq(compatibility.partId, parts.id))
}

export async function getVehiclesByPart(partId: string) {
  return db
    .select()
    .from(compatibility)
    .where(eq(compatibility.partId, partId))
    .innerJoin(vehicles, eq(compatibility.vehicleId, vehicles.id))
}

export async function searchVehicles(query: string) {
  const searchTerm = `%${query}%`
  return db
    .select()
    .from(vehicles)
    .where(or(
      ilike(vehicles.make, searchTerm),
      ilike(vehicles.makeAr, searchTerm),
      ilike(vehicles.model, searchTerm),
      ilike(vehicles.modelAr, searchTerm),
    ))
    .limit(20)
}
