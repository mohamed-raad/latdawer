import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().min(1),
  slug: z.string().min(1),
  parentId: z.string().optional(),
})

export const createManufacturerSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().min(1),
  slug: z.string().min(1),
  country: z.string().optional(),
})

export const updateUserRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['Customer', 'StoreManager', 'Admin', 'SuperAdmin']),
})
