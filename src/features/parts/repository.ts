import { db } from '@/db'
import { parts, categories, manufacturers } from '@/db/schema'
import { eq, or } from 'drizzle-orm'

export type PartDetail = typeof parts.$inferSelect & {
  category: { id: string; name: string; nameAr: string } | null
  manufacturer: { id: string; name: string; nameAr: string } | null
}

export async function getPartById(id: string): Promise<PartDetail | null> {
  const [result] = await db
    .select({
      id: parts.id,
      nameAr: parts.nameAr,
      nameEn: parts.nameEn,
      description: parts.description,
      descriptionAr: parts.descriptionAr,
      partNumber: parts.partNumber,
      oemNumber: parts.oemNumber,
      barcode: parts.barcode,
      categoryId: parts.categoryId,
      manufacturerId: parts.manufacturerId,
      brand: parts.brand,
      origin: parts.origin,
      condition: parts.condition,
      tags: parts.tags,
      alternativeNames: parts.alternativeNames,
      searchVector: parts.searchVector,
      createdAt: parts.createdAt,
      updatedAt: parts.updatedAt,
      category: {
        id: categories.id,
        name: categories.name,
        nameAr: categories.nameAr,
      },
      manufacturer: {
        id: manufacturers.id,
        name: manufacturers.name,
        nameAr: manufacturers.nameAr,
      },
    })
    .from(parts)
    .where(eq(parts.id, id))
    .leftJoin(categories, eq(parts.categoryId, categories.id))
    .leftJoin(manufacturers, eq(parts.manufacturerId, manufacturers.id))

  return result ?? null
}

export async function createPart(data: typeof parts.$inferInsert) {
  const [part] = await db.insert(parts).values(data).returning()
  return part
}

export async function getPartByPartNumber(partNumber: string): Promise<PartDetail | null> {
  const [result] = await db
    .select({
      id: parts.id,
      nameAr: parts.nameAr,
      nameEn: parts.nameEn,
      description: parts.description,
      descriptionAr: parts.descriptionAr,
      partNumber: parts.partNumber,
      oemNumber: parts.oemNumber,
      barcode: parts.barcode,
      categoryId: parts.categoryId,
      manufacturerId: parts.manufacturerId,
      brand: parts.brand,
      origin: parts.origin,
      condition: parts.condition,
      tags: parts.tags,
      alternativeNames: parts.alternativeNames,
      searchVector: parts.searchVector,
      createdAt: parts.createdAt,
      updatedAt: parts.updatedAt,
      category: {
        id: categories.id,
        name: categories.name,
        nameAr: categories.nameAr,
      },
      manufacturer: {
        id: manufacturers.id,
        name: manufacturers.name,
        nameAr: manufacturers.nameAr,
      },
    })
    .from(parts)
    .where(or(eq(parts.partNumber, partNumber), eq(parts.oemNumber, partNumber)))
    .leftJoin(categories, eq(parts.categoryId, categories.id))
    .leftJoin(manufacturers, eq(parts.manufacturerId, manufacturers.id))

  return result ?? null
}
