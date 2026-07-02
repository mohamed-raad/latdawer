import { db } from '@/db'
import { watchlist } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function getWatchlistEntry(userId: string, partId: string) {
  const [entry] = await db
    .select()
    .from(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.partId, partId)))
  return entry ?? null
}

export async function addWatchlistEntry(userId: string, partId: string) {
  const [entry] = await db
    .insert(watchlist)
    .values({
      id: crypto.randomUUID(),
      userId,
      partId,
      createdAt: new Date(),
    })
    .returning()
  return entry
}

export async function removeWatchlistEntry(userId: string, partId: string) {
  await db
    .delete(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.partId, partId)))
}
