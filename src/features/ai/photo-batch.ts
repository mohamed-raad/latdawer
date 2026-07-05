import { db } from '@/db'
import { images, parts, vehicles, compatibility } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

interface PhotoResult { url: string; source: string }

const VEHICLE_IMAGES: Record<string, string> = {
  'Toyota': 'https://www.carparts.com/blog/wp-content/uploads/2022/01/toyota-logo.jpg',
  'Nissan': 'https://www.carparts.com/blog/wp-content/uploads/2022/01/nissan-logo.jpg',
  'Hyundai': 'https://www.carparts.com/blog/wp-content/uploads/2022/01/hyundai-logo.jpg',
  'Kia': 'https://www.carparts.com/blog/wp-content/uploads/2022/01/kia-logo.jpg',
  'Chevrolet': 'https://www.carparts.com/blog/wp-content/uploads/2022/01/chevrolet-logo.jpg',
  'Ford': 'https://www.carparts.com/blog/wp-content/uploads/2022/01/ford-logo.jpg',
  'BMW': 'https://www.carparts.com/blog/wp-content/uploads/2022/01/bmw-logo.jpg',
  'Mercedes': 'https://www.carparts.com/blog/wp-content/uploads/2022/01/mercedes-logo.jpg',
  'Honda': 'https://www.carparts.com/blog/wp-content/uploads/2022/01/honda-logo.jpg',
  'Mitsubishi': 'https://www.carparts.com/blog/wp-content/uploads/2022/01/mitsubishi-logo.jpg',
  'Suzuki': 'https://www.carparts.com/blog/wp-content/uploads/2022/01/suzuki-logo.jpg',
  'Mazda': 'https://www.carparts.com/blog/wp-content/uploads/2022/01/mazda-logo.jpg',
}

const PART_TYPE_IMAGES: Record<string, string> = {
  'alternator': 'https://www.carparts.com/blog/wp-content/uploads/2022/01/car-alternator.jpg',
  'battery': 'https://www.carparts.com/blog/wp-content/uploads/2021/12/car-battery.jpg',
  'filter': 'https://www.carparts.com/blog/wp-content/uploads/2020/07/oil-filter.jpg',
  'spark plug': 'https://www.carparts.com/blog/wp-content/uploads/2020/07/spark-plug.jpg',
  'brake': 'https://www.carparts.com/blog/wp-content/uploads/2020/07/brake-pads.jpg',
  'belt': 'https://www.carparts.com/blog/wp-content/uploads/2020/07/drive-belt.jpg',
  'pulley': 'https://www.carparts.com/blog/wp-content/uploads/2020/07/pulley.jpg',
  'wiper': 'https://www.carparts.com/blog/wp-content/uploads/2020/07/wiper-blades.jpg',
}

export async function fetchPhotosForPart(partNameAr: string, partNameEn: string | null, partNumber: string | null, make: string, model: string, year: string, _category: string | null): Promise<PhotoResult[]> {
  const results: PhotoResult[] = []

  // 1. Try manufacturer logo first (always works)
  if (make && VEHICLE_IMAGES[make]) {
    results.push({ url: VEHICLE_IMAGES[make], source: 'manufacturer_logo' })
  }

  // 2. Try part type image (always works)
  if (partNameEn) {
    const lowerName = partNameEn.toLowerCase()
    for (const [type, url] of Object.entries(PART_TYPE_IMAGES)) {
      if (lowerName.includes(type)) {
        results.push({ url, source: 'part_type' })
        break
      }
    }
  }

  // 3. Try Wikipedia (may fail on CF Workers)
  try {
    const wikiPhotos = await searchWikipediaImages(partNameEn || partNameAr, make, model)
    results.push(...wikiPhotos)
  } catch {
    // Continue with what we have
  }

  return results.slice(0, 5)
}

async function searchWikipediaImages(query: string, make: string, _model: string): Promise<PhotoResult[]> {
  const results: PhotoResult[] = []
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' ' + make)}&format=json&srlimit=3`
    const searchResponse = await fetch(searchUrl, { headers: { 'User-Agent': 'LatdawerBot/1.0 (contact@latdawer.com)' } })
    if (!searchResponse.ok) return results
    const searchData = await searchResponse.json()
    const pageIds = searchData.query?.search?.map((s: { pageid: number }) => s.pageid) || []
    if (pageIds.length === 0) return results
    const imagesUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageIds.join('|')}&prop=pageimages&format=json&pithumbsize=800`
    const imagesResponse = await fetch(imagesUrl, { headers: { 'User-Agent': 'LatdawerBot/1.0 (contact@latdawer.com)' } })
    if (!imagesResponse.ok) return results
    const imagesData = await imagesResponse.json()
    const pages = imagesData.query?.pages || {}
    for (const page of Object.values(pages)) { const p = page as { thumbnail?: { source: string }; title?: string }; if (p.thumbnail?.source) results.push({ url: p.thumbnail.source, source: `wikipedia:${p.title || query}` }) }
  } catch {}
  return results
}

export async function batchFetchPhotosForAllParts(): Promise<{ processed: number; photosFound: number }> {
  const partsWithoutPhotos = await db.select({ id: parts.id, nameAr: parts.nameAr, nameEn: parts.nameEn, partNumber: parts.partNumber }).from(parts).leftJoin(images, eq(parts.id, images.partId)).where(isNull(images.id)).groupBy(parts.id)
  let processed = 0, photosFound = 0
  for (const part of partsWithoutPhotos) {
    try {
      const compatibleVehicles = await db.select({ make: vehicles.make, model: vehicles.model, year: vehicles.year }).from(compatibility).innerJoin(vehicles, eq(compatibility.vehicleId, vehicles.id)).where(eq(compatibility.partId, part.id)).limit(3)
      if (compatibleVehicles.length === 0) {
        const photos = await fetchPhotosForPart(part.nameAr, part.nameEn, part.partNumber, '', '', '', null)
        if (photos.length > 0) { await savePhotos(part.id, null, null, photos); photosFound += photos.length }
      } else {
        for (const vehicle of compatibleVehicles) {
          const photos = await fetchPhotosForPart(part.nameAr, part.nameEn, part.partNumber, vehicle.make, vehicle.model, vehicle.year, null)
          if (photos.length > 0) { await savePhotos(part.id, null, null, photos); photosFound += photos.length; break }
        }
      }
      processed++; await new Promise((r) => setTimeout(r, 500))
    } catch { processed++ }
  }
  return { processed, photosFound }
}

export async function batchFetchPhotosByManufacturer(manufacturerId: string): Promise<{ processed: number; photosFound: number }> {
  const partsByMfr = await db.select({ id: parts.id, nameAr: parts.nameAr, nameEn: parts.nameEn, partNumber: parts.partNumber }).from(parts).leftJoin(images, eq(parts.id, images.partId)).where(and(eq(parts.manufacturerId, manufacturerId), isNull(images.id))).groupBy(parts.id)
  let processed = 0, photosFound = 0
  for (const part of partsByMfr) {
    try {
      const compatibleVehicles = await db.select({ make: vehicles.make, model: vehicles.model, year: vehicles.year }).from(compatibility).innerJoin(vehicles, eq(compatibility.vehicleId, vehicles.id)).where(eq(compatibility.partId, part.id)).limit(3)
      for (const vehicle of compatibleVehicles) {
        const photos = await fetchPhotosForPart(part.nameAr, part.nameEn, part.partNumber, vehicle.make, vehicle.model, vehicle.year, null)
        if (photos.length > 0) { await savePhotos(part.id, null, null, photos); photosFound += photos.length; break }
      }
      processed++; await new Promise((r) => setTimeout(r, 500))
    } catch { processed++ }
  }
  return { processed, photosFound }
}

async function savePhotos(partId: string, inventoryId: string | null, storeId: string | null, photos: PhotoResult[]): Promise<void> {
  for (const photo of photos) { await db.insert(images).values({ id: crypto.randomUUID(), url: photo.url, storageType: 'url', inventoryId, partId, storeId, type: 'auto_fetched', isAutoGenerated: true, createdAt: new Date() }) }
}

export async function getPartPhotos(partId: string) { return db.select({ url: images.url, type: images.type, isAutoGenerated: images.isAutoGenerated }).from(images).where(eq(images.partId, partId)) }
export async function deleteAutoFetchedPhotos(partId: string): Promise<void> { await db.delete(images).where(and(eq(images.partId, partId), eq(images.isAutoGenerated, true))) }
