import { db } from '@/db'
import { disputes } from '@/db/schema/advanced'
import { stores } from '@/db/schema/users'
import { eq, desc } from 'drizzle-orm'

export async function createDispute(data: {
  transactionId: string
  userId: string
  storeId: string
  reason: string
  description?: string
}) {
  const [dispute] = await db.insert(disputes).values({
    id: crypto.randomUUID(),
    ...data,
    status: 'open',
    createdAt: new Date(),
  }).returning()
  return dispute
}

export async function getDispute(id: string) {
  const [result] = await db
    .select({
      dispute: disputes,
      store: {
        id: stores.id,
        nameAr: stores.nameAr,
        name: stores.name,
        phone: stores.phone,
      },
    })
    .from(disputes)
    .innerJoin(stores, eq(disputes.storeId, stores.id))
    .where(eq(disputes.id, id))
  return result
}

export async function listUserDisputes(userId: string) {
  return db
    .select({
      dispute: disputes,
      store: {
        id: stores.id,
        nameAr: stores.nameAr,
        name: stores.name,
      },
    })
    .from(disputes)
    .innerJoin(stores, eq(disputes.storeId, stores.id))
    .where(eq(disputes.userId, userId))
    .orderBy(desc(disputes.createdAt))
}

export async function resolveDispute(id: string, resolution: string) {
  const [dispute] = await db
    .update(disputes)
    .set({
      status: 'resolved',
      resolution,
      resolvedAt: new Date(),
    })
    .where(eq(disputes.id, id))
    .returning()
  return dispute
}
