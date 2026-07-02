import { z } from 'zod'

export const createRequestSchema = z.object({
  title: z.string().min(1, 'حقل مطلوب').max(200),
  description: z.string().max(1000).optional(),
  partNumber: z.string().max(100).optional(),
  vehicleMake: z.string().max(100).optional(),
  vehicleModel: z.string().max(100).optional(),
  vehicleYear: z.string().max(10).optional(),
  city: z.string().min(1, 'المدينة مطلوبة'),
})

export const requestsQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  status: z.enum(['open', 'offered', 'closed', 'cancelled']).optional(),
  city: z.string().optional(),
})

export const createOfferSchema = z.object({
  requestId: z.string().min(1),
  price: z.number().positive('يجب أن يكون السعر موجباً').optional(),
  notes: z.string().max(500).optional(),
})

export const updateOfferStatusSchema = z.object({
  offerId: z.string().min(1),
  status: z.enum(['accepted', 'rejected']),
})
