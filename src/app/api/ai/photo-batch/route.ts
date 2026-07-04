import { NextRequest, NextResponse } from 'next/server'
import { batchFetchPhotosForAllParts, batchFetchPhotosByManufacturer } from '@/features/ai/photo-batch'
import { db } from '@/db'
import { manufacturers } from '@/db/schema'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mode, manufacturerId } = body
    let result
    if (mode === 'all') { result = await batchFetchPhotosForAllParts() }
    else if (mode === 'manufacturer' && manufacturerId) { result = await batchFetchPhotosByManufacturer(manufacturerId) }
    else if (mode === 'manufacturers') {
      const allManufacturers = await db.select().from(manufacturers)
      let totalProcessed = 0, totalPhotos = 0
      for (const mfr of allManufacturers) { const r = await batchFetchPhotosByManufacturer(mfr.id); totalProcessed += r.processed; totalPhotos += r.photosFound }
      result = { processed: totalProcessed, photosFound: totalPhotos }
    } else { return NextResponse.json({ error: 'Invalid mode' }, { status: 400 }) }
    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() })
  } catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 }) }
}

export async function GET() {
  return NextResponse.json({ message: 'Photo batch endpoint', modes: ['all', 'manufacturers', 'manufacturer'] })
}
