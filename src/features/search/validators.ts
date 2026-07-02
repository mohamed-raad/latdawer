import { z } from 'zod'

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  type: z.enum(['parts', 'stores', 'all']).default('all'),
  categoryId: z.string().optional(),
  manufacturerId: z.string().optional(),
  vehicleId: z.string().optional(),
  origin: z.string().optional(),
  condition: z.enum(['new', 'used', 'refurbished', 'salvage']).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  city: z.string().optional(),
  storeId: z.string().optional(),
  inStockOnly: z.boolean().optional(),
  sortBy: z.enum(['price', 'relevance', 'distance', 'quantity']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})
