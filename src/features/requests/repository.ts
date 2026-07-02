import { db } from '@/db'
import { partRequests, requestOffers, stores, users } from '@/db/schema'
import { eq, desc, and, count } from 'drizzle-orm'

export async function insertRequest(data: {
  userId: string
  title: string
  description?: string | null
  partNumber?: string | null
  vehicleMake?: string | null
  vehicleModel?: string | null
  vehicleYear?: string | null
  city: string
}) {
  const now = new Date()
  const [req] = await db
    .insert(partRequests)
    .values({ id: crypto.randomUUID(), ...data, status: 'open', createdAt: now, updatedAt: now })
    .returning()
  return req
}

export async function getRequestById(id: string) {
  const [req] = await db
    .select({
      id: partRequests.id,
      userId: partRequests.userId,
      title: partRequests.title,
      description: partRequests.description,
      partNumber: partRequests.partNumber,
      vehicleMake: partRequests.vehicleMake,
      vehicleModel: partRequests.vehicleModel,
      vehicleYear: partRequests.vehicleYear,
      city: partRequests.city,
      status: partRequests.status,
      createdAt: partRequests.createdAt,
      updatedAt: partRequests.updatedAt,
      userName: users.name,
    })
    .from(partRequests)
    .innerJoin(users, eq(partRequests.userId, users.id))
    .where(eq(partRequests.id, id))

  return req ?? null
}

export async function getRequests(params: {
  page: number
  limit: number
  status?: string
  city?: string
  userId?: string
}) {
  const offset = (params.page - 1) * params.limit
  const conditions: ReturnType<typeof eq>[] = []
  if (params.status) conditions.push(eq(partRequests.status, params.status))
  if (params.city) conditions.push(eq(partRequests.city, params.city))
  if (params.userId) conditions.push(eq(partRequests.userId, params.userId))

  const where = conditions.length ? and(...conditions) : undefined

  const results = await db
    .select({
      id: partRequests.id,
      title: partRequests.title,
      partNumber: partRequests.partNumber,
      vehicleMake: partRequests.vehicleMake,
      vehicleModel: partRequests.vehicleModel,
      vehicleYear: partRequests.vehicleYear,
      city: partRequests.city,
      status: partRequests.status,
      createdAt: partRequests.createdAt,
      userName: users.name,
      offerCount: count(requestOffers.id),
    })
    .from(partRequests)
    .innerJoin(users, eq(partRequests.userId, users.id))
    .leftJoin(requestOffers, eq(requestOffers.requestId, partRequests.id))
    .where(where)
    .groupBy(partRequests.id)
    .orderBy(desc(partRequests.createdAt))
    .limit(params.limit)
    .offset(offset)

  const [{ total }] = await db
    .select({ total: count() })
    .from(partRequests)
    .where(where ?? undefined)

  return { results, total: Number(total), page: params.page, limit: params.limit }
}

export async function getOffersByRequest(requestId: string) {
  return db
    .select({
      id: requestOffers.id,
      requestId: requestOffers.requestId,
      price: requestOffers.price,
      notes: requestOffers.notes,
      status: requestOffers.status,
      createdAt: requestOffers.createdAt,
      storeId: stores.id,
      storeName: stores.name,
      storeNameAr: stores.nameAr,
      storeWhatsapp: stores.whatsapp,
    })
    .from(requestOffers)
    .innerJoin(stores, eq(requestOffers.storeId, stores.id))
    .where(eq(requestOffers.requestId, requestId))
    .orderBy(desc(requestOffers.createdAt))
}

export async function insertOffer(data: {
  requestId: string
  storeId: string
  price?: number | null
  notes?: string | null
}) {
  const [offer] = await db
    .insert(requestOffers)
    .values({ id: crypto.randomUUID(), ...data, status: 'pending', createdAt: new Date() })
    .returning()

  await db
    .update(partRequests)
    .set({ status: 'offered', updatedAt: new Date() })
    .where(eq(partRequests.id, data.requestId))

  return offer
}

export async function getOfferById(offerId: string) {
  const [offer] = await db
    .select({
      id: requestOffers.id,
      requestId: requestOffers.requestId,
      storeId: requestOffers.storeId,
      price: requestOffers.price,
      notes: requestOffers.notes,
      status: requestOffers.status,
      createdAt: requestOffers.createdAt,
    })
    .from(requestOffers)
    .where(eq(requestOffers.id, offerId))
  return offer ?? null
}

export async function updateOfferStatus(offerId: string, status: 'accepted' | 'rejected') {
  const [offer] = await db
    .update(requestOffers)
    .set({ status })
    .where(eq(requestOffers.id, offerId))
    .returning()
  return offer
}

export async function closeRequest(requestId: string) {
  const [req] = await db
    .update(partRequests)
    .set({ status: 'closed', updatedAt: new Date() })
    .where(eq(partRequests.id, requestId))
    .returning()
  return req
}
