import { db } from '@/db'
import { parts, inventory, stores, categories, manufacturers, compatibility } from '@/db/schema'
import { eq, ilike, or, and, sql, gt, gte, lte, inArray } from 'drizzle-orm'
import { normalizeSearchQuery } from '@/lib/search/normalize'

export interface SearchPartsParams {
  q: string
  categoryId?: string
  manufacturerId?: string
  city?: string
  inStockOnly?: boolean
  minPrice?: number
  maxPrice?: number
  origin?: string
  condition?: string
  vehicleId?: string
  sortBy?: 'price' | 'relevance' | 'distance' | 'quantity'
  sortOrder?: 'asc' | 'desc'
  page: number
  limit: number
}

import { calculateSearchScore } from '@/lib/search/ranking'
import { sortResults, SortBy, SortOrder } from '@/lib/search/sorting'

export async function searchParts(params: SearchPartsParams) {
  const normalizedQuery = normalizeSearchQuery(params.q)

  const searchTerm = `%${normalizedQuery}%`

  const textCondition = or(
    ilike(parts.partNumber, searchTerm),
    ilike(parts.oemNumber, searchTerm),
    ilike(parts.nameAr, searchTerm),
    ilike(parts.nameEn, searchTerm),
    ilike(parts.brand, searchTerm),
    ilike(parts.tags, searchTerm),
    ilike(parts.alternativeNames, searchTerm),
  )

  const filters: (typeof textCondition)[] = [textCondition]
  if (params.categoryId) filters.push(eq(parts.categoryId, params.categoryId))
  if (params.manufacturerId) filters.push(eq(parts.manufacturerId, params.manufacturerId))
  if (params.city) filters.push(eq(stores.city, params.city))
  if (params.inStockOnly) filters.push(gt(inventory.quantity, 0))
  if (params.origin) filters.push(eq(parts.origin, params.origin))
  if (params.condition) filters.push(eq(inventory.condition, params.condition))
  if (params.minPrice !== undefined) filters.push(gte(inventory.price, params.minPrice))
  if (params.maxPrice !== undefined) filters.push(lte(inventory.price, params.maxPrice))
  if (params.vehicleId) {
    const vehicleParts = await db
      .select({ partId: compatibility.partId })
      .from(compatibility)
      .where(eq(compatibility.vehicleId, params.vehicleId))
    const partIds = vehicleParts.map(p => p.partId)
    if (partIds.length > 0) {
      filters.push(inArray(parts.id, partIds))
    } else {
      filters.push(sql`1 = 0`)
    }
  }

  const whereClause = and(...filters)

  const allResults = await db
    .select({
      part: parts,
      storeCount: sql<number>`count(distinct ${inventory.storeId})`,
      minPrice: sql<number>`min(${inventory.price})`,
    })
    .from(parts)
    .leftJoin(inventory, eq(inventory.partId, parts.id))
    .leftJoin(stores, eq(inventory.storeId, stores.id))
    .where(whereClause)
    .groupBy(parts.id)

  const scoredResults = allResults.map(result => ({
    ...result,
    score: calculateSearchScore(normalizedQuery, result.part),
  }))

  const sortBy = params.sortBy || 'relevance'
  const sortOrder = params.sortOrder || 'desc'
  const sortedResults = sortResults(scoredResults, sortBy as SortBy, sortOrder as SortOrder)

  const offset = (params.page - 1) * params.limit
  const paginatedResults = sortedResults.slice(offset, offset + params.limit)

  return {
    results: paginatedResults,
    total: sortedResults.length,
    page: params.page,
    limit: params.limit
  }
}

export async function searchStores(query: string) {
  const normalizedQuery = normalizeSearchQuery(query)
  const searchTerm = `%${normalizedQuery}%`

  return db
    .select()
    .from(stores)
    .where(or(
      ilike(stores.name, searchTerm),
      ilike(stores.nameAr, searchTerm),
    ))
    .limit(20)
}

export async function getCategories() {
  return db.select().from(categories)
}

export async function getManufacturers() {
  return db.select().from(manufacturers)
}
