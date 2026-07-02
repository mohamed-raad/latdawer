import { getAlternatives, addAlternative, getRelatedByBrand } from './repository'
import { addAlternativeSchema, alternativesQuerySchema } from './validators'
import { partAlternatives } from '@/db/schema'

export async function listAlternatives(partId: string) {
  alternativesQuerySchema.parse({ partId })
  return getAlternatives(partId)
}

export async function createAlternative(data: unknown) {
  const parsed = addAlternativeSchema.parse(data)
  const entry = await addAlternative({
    partId: parsed.partId,
    altPartId: parsed.altPartId,
    type: parsed.type,
    notes: parsed.notes,
  } as typeof partAlternatives.$inferInsert)
  return entry
}

export async function searchByBrand(q: string) {
  return getRelatedByBrand(q)
}
