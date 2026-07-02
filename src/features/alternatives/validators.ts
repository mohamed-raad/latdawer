import { z } from 'zod'

export const addAlternativeSchema = z.object({
  partId: z.string(),
  altPartId: z.string(),
  type: z.enum(['equivalent', 'oem', 'aftermarket', 'replaces', 'replaced_by']),
  notes: z.string().optional(),
})

export const alternativesQuerySchema = z.object({
  partId: z.string(),
})
