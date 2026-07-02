import { getReviewsByStore, getStoreRatingStats, insertReview, getUserReview } from './repository'
import { createReviewSchema, reviewsQuerySchema } from './validators'

export async function getStoreRating(storeId: string) {
  return getStoreRatingStats(storeId)
}

export async function getStoreReviews(storeId: string, page: number, limit: number) {
  const parsed = reviewsQuerySchema.parse({ storeId, page, limit })
  return getReviewsByStore(parsed.storeId, parsed.page, parsed.limit)
}

export async function createReview(userId: string, storeId: string, rating: number, comment?: string) {
  const parsed = createReviewSchema.parse({ storeId, rating, comment })
  const existing = await getUserReview(userId, parsed.storeId)
  if (existing) {
    throw new Error('لقد قمت بتقييم هذا المتجر مسبقاً')
  }
  return insertReview(userId, parsed.storeId, parsed.rating, parsed.comment)
}

export async function hasUserReviewed(userId: string, storeId: string) {
  const review = await getUserReview(userId, storeId)
  return { reviewed: !!review, review }
}
