import { z } from 'zod'

export const createReviewSchema = z.object({
  storeId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

export const reviewsQuerySchema = z.object({
  storeId: z.string().min(1),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})
