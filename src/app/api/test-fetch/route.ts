import { NextResponse } from 'next/server'
import { db } from '@/db'
import { parts, compatibility, vehicles, images } from '@/db/schema'
import { eq, isNull } from 'drizzle-orm'

export async function GET() {
  // Check parts without photos
  const partsWithoutPhotos = await db
    .select({ id: parts.id, nameAr: parts.nameAr, nameEn: parts.nameEn })
    .from(parts)
    .leftJoin(images, eq(parts.id, images.partId))
    .where(isNull(images.id))
    .groupBy(parts.id)

  // Check compatibility for first part
  let firstPartCompat: unknown[] = []
  if (partsWithoutPhotos.length > 0) {
    firstPartCompat = await db
      .select({ make: vehicles.make, model: vehicles.model })
      .from(compatibility)
      .innerJoin(vehicles, eq(compatibility.vehicleId, vehicles.id))
      .where(eq(compatibility.partId, partsWithoutPhotos[0].id))
      .limit(3)
  }

  // Test external fetch
  let fetchTest = 'unknown'
  try {
    const res = await fetch('https://www.carparts.com/blog/wp-content/uploads/2022/01/car-alternator.jpg', { method: 'HEAD' })
    fetchTest = `${res.status} ${res.headers.get('content-type')}`
  } catch (e) {
    fetchTest = `error: ${e instanceof Error ? e.message : 'unknown'}`
  }

  return NextResponse.json({
    partsWithoutPhotos: partsWithoutPhotos.length,
    firstPart: partsWithoutPhotos[0] || null,
    compatibility: firstPartCompat,
    fetchTest,
  })
}
