import { db } from '@/db'
import { transactions } from '@/db/schema/advanced'
import { stores } from '@/db/schema/users'
import { eq, desc, and, sql } from 'drizzle-orm'

export async function listUserTransactions(userId: string, options?: {
  status?: string
  limit?: number
  offset?: number
}) {
  const limit = options?.limit || 20
  const offset = options?.offset || 0

  const conditions = [eq(transactions.userId, userId)]
  if (options?.status) {
    conditions.push(eq(transactions.status, options.status))
  }

  return db
    .select({
      transaction: transactions,
      store: {
        id: stores.id,
        nameAr: stores.nameAr,
        name: stores.name,
        phone: stores.phone,
      },
    })
    .from(transactions)
    .innerJoin(stores, eq(transactions.storeId, stores.id))
    .where(and(...conditions))
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset)
}

export async function getTransaction(id: string) {
  const [result] = await db
    .select({
      transaction: transactions,
      store: {
        id: stores.id,
        nameAr: stores.nameAr,
        name: stores.name,
        phone: stores.phone,
        address: stores.address,
      },
    })
    .from(transactions)
    .innerJoin(stores, eq(transactions.storeId, stores.id))
    .where(eq(transactions.id, id))
  return result
}

export async function getTransactionStats(userId: string) {
  const [stats] = await db
    .select({
      totalTransactions: sql<number>`count(*)`,
      totalSpent: sql<number>`coalesce(sum(${transactions.totalAmount}), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId))

  return stats
}
