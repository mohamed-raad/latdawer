import { db } from '@/db'
import { partAlternatives, parts } from '@/db/schema'
import { eq, like } from 'drizzle-orm'

export async function getAlternatives(partId: string) {
  return db
    .select({
      id: partAlternatives.id,
      partId: partAlternatives.partId,
      altPartId: partAlternatives.altPartId,
      type: partAlternatives.type,
      notes: partAlternatives.notes,
      createdAt: partAlternatives.createdAt,
      altPart: {
        id: parts.id,
        nameAr: parts.nameAr,
        nameEn: parts.nameEn,
        partNumber: parts.partNumber,
        brand: parts.brand,
      },
    })
    .from(partAlternatives)
    .where(eq(partAlternatives.partId, partId))
    .innerJoin(parts, eq(partAlternatives.altPartId, parts.id))
}

export async function addAlternative(data: typeof partAlternatives.$inferInsert) {
  const now = new Date()
  const [entry] = await db.insert(partAlternatives).values([
    {
      id: crypto.randomUUID(),
      partId: data.partId,
      altPartId: data.altPartId,
      type: data.type,
      notes: data.notes,
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      partId: data.altPartId,
      altPartId: data.partId,
      type: data.type,
      notes: data.notes,
      createdAt: now,
    },
  ]).returning()
  return entry
}

export async function getRelatedByBrand(q: string) {
  const searchTerm = `%${q}%`
  return db
    .select({
      id: parts.id,
      nameAr: parts.nameAr,
      nameEn: parts.nameEn,
      partNumber: parts.partNumber,
      brand: parts.brand,
      manufacturerId: parts.manufacturerId,
    })
    .from(parts)
    .where(like(parts.partNumber, searchTerm))
    .limit(20)
}
