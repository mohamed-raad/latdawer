import { db } from '@/db'
import { userVehicles, vehicles, compatibility, parts } from '@/db/schema'
import { eq, desc, and, count, like } from 'drizzle-orm'

export async function addUserVehicle(data: {
  userId: string
  vehicleId: string
  nickname?: string | null
  licensePlate?: string | null
}) {
  const [entry] = await db
    .insert(userVehicles)
    .values({ id: crypto.randomUUID(), ...data, createdAt: new Date() })
    .returning()
  return entry
}

export async function getUserVehicles(userId: string) {
  return db
    .select({
      id: userVehicles.id,
      vehicleId: userVehicles.vehicleId,
      nickname: userVehicles.nickname,
      licensePlate: userVehicles.licensePlate,
      createdAt: userVehicles.createdAt,
      make: vehicles.make,
      makeAr: vehicles.makeAr,
      model: vehicles.model,
      modelAr: vehicles.modelAr,
      year: vehicles.year,
      engine: vehicles.engine,
      trim: vehicles.trim,
    })
    .from(userVehicles)
    .innerJoin(vehicles, eq(userVehicles.vehicleId, vehicles.id))
    .where(eq(userVehicles.userId, userId))
    .orderBy(desc(userVehicles.createdAt))
}

export async function removeUserVehicle(userId: string, vehicleId: string) {
  await db
    .delete(userVehicles)
    .where(and(eq(userVehicles.userId, userId), eq(userVehicles.vehicleId, vehicleId)))
}

export async function getCompatibleParts(vehicleId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit
  const results = await db
    .select({
      id: parts.id,
      nameAr: parts.nameAr,
      nameEn: parts.nameEn,
      partNumber: parts.partNumber,
      brand: parts.brand,
      condition: parts.condition,
      categoryId: parts.categoryId,
      manufacturerId: parts.manufacturerId,
    })
    .from(compatibility)
    .innerJoin(parts, eq(compatibility.partId, parts.id))
    .where(eq(compatibility.vehicleId, vehicleId))
    .limit(limit)
    .offset(offset)

  const [{ total }] = await db
    .select({ total: count() })
    .from(compatibility)
    .where(eq(compatibility.vehicleId, vehicleId))

  return { results, total: Number(total), page, limit }
}

export async function getMakes() {
  const rows = await db
    .select({ make: vehicles.make, makeAr: vehicles.makeAr })
    .from(vehicles)
    .groupBy(vehicles.make)
    .orderBy(vehicles.make)
  return rows
}

export async function getModels(make: string) {
  const rows = await db
    .select({ model: vehicles.model, modelAr: vehicles.modelAr })
    .from(vehicles)
    .where(eq(vehicles.make, make))
    .groupBy(vehicles.model)
  return rows
}

export async function getYears(make: string, model: string) {
  const rows = await db
    .select({ year: vehicles.year, engine: vehicles.engine, trim: vehicles.trim, id: vehicles.id })
    .from(vehicles)
    .where(and(eq(vehicles.make, make), eq(vehicles.model, model)))
    .orderBy(vehicles.year)
  return rows
}

export async function searchVehicles(q: string) {
  const term = `%${q}%`
  return db
    .select()
    .from(vehicles)
    .where(like(vehicles.make, term))
    .limit(10)
}
