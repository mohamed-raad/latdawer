import { z } from 'zod'

export const addWatchSchema = z.object({
  partId: z.string(),
  maxPrice: z.number().positive().optional(),
})

export const removeWatchSchema = z.object({
  partId: z.string(),
})
