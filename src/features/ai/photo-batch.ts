import { db } from '@/db'
import { images, parts, vehicles, compatibility } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

interface PhotoResult { url: string; source: string }

const VEHICLE_IMAGES: Record<string, string> = {
  'Toyota': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Toyota_logo.svg/512px-Toyota_logo.svg.png',
  'Nissan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Nissan_logo_%282020%29.svg/512px-Nissan_logo_%282020%29.svg.png',
  'Hyundai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Hyundai_Motor_Company_logo.svg/512px-Hyundai_Motor_Company_logo.svg.png',
  'Kia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Kia_logo.svg/512px-Kia_logo.svg.png',
  'Chevrolet': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Chevrolet-logo.png/512px-Chevrolet-logo.png',
  'Ford': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Ford_Motor_Company_Logo.svg/512px-Ford_Motor_Company_Logo.svg.png',
  'BMW': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/512px-BMW.svg.png',
  'Mercedes': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Mercedes-Benz-logo-notext.svg/512px-Mercedes-Benz-logo-notext.svg.png',
  'Honda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Honda.svg/512px-Honda.svg.png',
  'Mitsubishi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Mitsubishi_logo.svg/512px-Mitsubishi_logo.svg.png',
  'Suzuki': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/S_logo.svg/512px-S_logo.svg.png',
  'Mazda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Mazda_logo_%282018%29.svg/512px-Mazda_logo_%282018%29.svg.png',
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
