import { db } from '@/db'
import { stores, storeManagers, inventory } from '@/db/schema'
import { eq, count } from 'drizzle-orm'

export async function getStores(page = 1, limit = 20) {
  const offset = (page - 1) * limit
  const results = await db.select().from(stores).limit(limit).offset(offset)
  const [{ total }] = await db.select({ total: count() }).from(stores)
  return { results, total: Number(total), page, limit }
}

export async function getStoreById(id: string) {
  const [store] = await db.select().from(stores).where(eq(stores.id, id))
  if (!store) return null

  const [{ total }] = await db
    .select({ total: count() })
    .from(inventory)
    .where(eq(inventory.storeId, id))

  return { ...store, inventoryCount: String(total) }
}

export async function createStore(data: typeof stores.$inferInsert) {
  const [store] = await db.insert(stores).values(data).returning()
  return store
}

export async function updateStore(id: string, data: Record<string, unknown>) {
  const [store] = await db.update(stores).set(data as typeof stores.$inferInsert).where(eq(stores.id, id)).returning()
  return store
}

export async function addStoreManager(userId: string, storeId: string) {
  const [manager] = await db.insert(storeManagers).values({
    id: crypto.randomUUID(),
    userId,
    storeId,
    createdAt: new Date(),
  }).returning()
  return manager
}

export async function getStoreByManager(userId: string) {
  const result = await db
    .select()
    .from(storeManagers)
    .where(eq(storeManagers.userId, userId))
    .innerJoin(stores, eq(storeManagers.storeId, stores.id))
  return result.length > 0 ? result[0].stores : null
}
