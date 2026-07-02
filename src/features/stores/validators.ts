import { z } from 'zod'

export const createStoreSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  city: z.string().min(1),
  address: z.string().optional(),
  gpsLat: z.string().optional(),
  gpsLng: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  workingHours: z.string().optional(),
})

export const updateStoreSchema = createStoreSchema.partial()

export const storeQuerySchema = z.object({
  search: z.string().optional(),
  verified: z.enum(['pending', 'verified', 'rejected']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})
