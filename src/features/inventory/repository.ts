import { db } from '@/db'
import { inventory, parts, stores } from '@/db/schema'
import { eq, asc, count } from 'drizzle-orm'

export async function getInventoryByStore(storeId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit
  const results = await db
    .select({
      inventory: inventory,
      part: parts,
    })
    .from(inventory)
    .innerJoin(parts, eq(inventory.partId, parts.id))
    .where(eq(inventory.storeId, storeId))
    .limit(limit)
    .offset(offset)

  const [{ total }] = await db
    .select({ total: count() })
    .from(inventory)
    .where(eq(inventory.storeId, storeId))

  return { results, total: Number(total), page, limit }
}

export async function createInventory(data: typeof inventory.$inferInsert) {
  const [item] = await db.insert(inventory).values(data).returning()
  return item
}

export async function updateInventory(id: string, data: Record<string, unknown>) {
  const [item] = await db.update(inventory).set(data as typeof inventory.$inferInsert).where(eq(inventory.id, id)).returning()
  return item
}

export async function deleteInventory(id: string) {
  await db.delete(inventory).where(eq(inventory.id, id))
}

export async function getInventoryById(id: string) {
  const [item] = await db
    .select()
    .from(inventory)
    .where(eq(inventory.id, id))
    .leftJoin(parts, eq(inventory.partId, parts.id))
  return item
}

export async function getInventoryByPartId(partId: string) {
  return db
    .select({
      id: inventory.id,
      partId: inventory.partId,
      storeId: inventory.storeId,
      price: inventory.price,
      currency: inventory.currency,
      quantity: inventory.quantity,
      condition: inventory.condition,
      status: inventory.status,
      installationPrice: inventory.installationPrice,
      notes: inventory.notes,
      notesAr: inventory.notesAr,
      createdAt: inventory.createdAt,
      updatedAt: inventory.updatedAt,
      store: {
        id: stores.id,
        name: stores.name,
        nameAr: stores.nameAr,
        whatsapp: stores.whatsapp,
        phone: stores.phone,
        city: stores.city,
      },
    })
    .from(inventory)
    .where(eq(inventory.partId, partId))
    .innerJoin(stores, eq(inventory.storeId, stores.id))
}

export async function getByPartSortedByPrice(partId: string) {
  return db
    .select({
      id: inventory.id,
      price: inventory.price,
      currency: inventory.currency,
      quantity: inventory.quantity,
      condition: inventory.condition,
      installationPrice: inventory.installationPrice,
      store: {
        id: stores.id,
        name: stores.name,
        nameAr: stores.nameAr,
        whatsapp: stores.whatsapp,
        phone: stores.phone,
        city: stores.city,
        verified: stores.verified,
      },
    })
    .from(inventory)
    .where(eq(inventory.partId, partId))
    .innerJoin(stores, eq(inventory.storeId, stores.id))
    .orderBy(asc(inventory.price))
}
