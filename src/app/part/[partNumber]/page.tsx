import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/db'
import { parts, categories, manufacturers } from '@/db/schema'
import { eq, or } from 'drizzle-orm'

async function getPart(partNumber: string) {
  const [result] = await db
    .select({
      id: parts.id,
      nameAr: parts.nameAr,
      nameEn: parts.nameEn,
      partNumber: parts.partNumber,
      oemNumber: parts.oemNumber,
      brand: parts.brand,
      descriptionAr: parts.descriptionAr,
      description: parts.description,
      category: { nameAr: categories.nameAr },
      manufacturer: { nameAr: manufacturers.nameAr },
    })
    .from(parts)
    .where(or(eq(parts.partNumber, partNumber), eq(parts.oemNumber, partNumber)))
    .leftJoin(categories, eq(parts.categoryId, categories.id))
    .leftJoin(manufacturers, eq(parts.manufacturerId, manufacturers.id))

  return result ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ partNumber: string }> }): Promise<Metadata> {
  const { partNumber } = await params
  const part = await getPart(partNumber)
  if (!part) return { title: 'القطعة غير موجودة' }
  return {
    title: `${part.nameAr} | ${part.partNumber}`,
    description: part.descriptionAr || part.description || `رقم القطعة: ${part.partNumber} | ${part.brand || ''} | ${part.manufacturer?.nameAr || ''}`,
    openGraph: {
      title: `${part.nameAr} | لاتدور`,
      description: `قطعة غيار: ${part.nameAr} (${part.nameEn}) | ${part.brand || ''} | ${part.manufacturer?.nameAr || ''}`,
    },
  }
}

export default async function PartNumberPage({ params }: { params: Promise<{ partNumber: string }> }) {
  const { partNumber } = await params
  const part = await getPart(partNumber)
  if (!part) notFound()
  redirect(`/parts/${part.id}`)
}
