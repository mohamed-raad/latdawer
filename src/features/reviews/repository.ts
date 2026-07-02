import { db } from '@/db'
import { reviews, users } from '@/db/schema'
import { eq, desc, count, sql, and } from 'drizzle-orm'

export type ReviewWithUser = {
  id: string
  rating: number
  comment: string | null
  createdAt: Date
  user: { id: string; name: string }
}

export type StoreRating = {
  average: number
  count: number
}

export async function getReviewsByStore(storeId: string, page: number, limit: number) {
  const offset = (page - 1) * limit
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      userId: reviews.userId,
      userName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.storeId, storeId))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .offset(offset)

  const [{ total }] = await db
    .select({ total: count() })
    .from(reviews)
    .where(eq(reviews.storeId, storeId))

  const results: ReviewWithUser[] = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    user: { id: r.userId, name: r.userName },
  }))

  return { results, total: Number(total), page, limit }
}

export async function getStoreRatingStats(storeId: string): Promise<StoreRating> {
  const [result] = await db
    .select({
      average: sql<number>`round(avg(${reviews.rating}), 1)`,
      count: count(),
    })
    .from(reviews)
    .where(eq(reviews.storeId, storeId))

  return { average: result?.average ?? 0, count: Number(result?.count ?? 0) }
}

export async function insertReview(userId: string, storeId: string, rating: number, comment?: string) {
  const [review] = await db
    .insert(reviews)
    .values({
      id: crypto.randomUUID(),
      userId,
      storeId,
      rating,
      comment: comment ?? null,
      createdAt: new Date(),
    })
    .returning()
  return review
}

export async function getUserReview(userId: string, storeId: string) {
  const [review] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.storeId, storeId)))
  return review ?? null
}
