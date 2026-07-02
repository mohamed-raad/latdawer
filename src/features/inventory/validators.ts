import { z } from 'zod'

export const createInventorySchema = z.object({
  partId: z.string(),
  storeId: z.string(),
  price: z.number().positive(),
  currency: z.string().default('IQD'),
  quantity: z.number().int().min(0).default(0),
  condition: z.enum(['new', 'used', 'refurbished', 'salvage']).default('new'),
  status: z.enum(['active', 'inactive', 'out_of_stock']).default('active'),
  installationPrice: z.number().positive().optional(),
  notes: z.string().optional(),
  notesAr: z.string().optional(),
  imageUrls: z.array(z.string().url()).optional(),
})

export const updateInventorySchema = createInventorySchema.partial()

export const inventoryQuerySchema = z.object({
  storeId: z.string().optional(),
  categoryId: z.string().optional(),
  manufacturerId: z.string().optional(),
  vehicleId: z.string().optional(),
  condition: z.enum(['new', 'used', 'refurbished', 'salvage']).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  status: z.enum(['active', 'inactive', 'out_of_stock']).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['price', 'createdAt', 'quantity']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
