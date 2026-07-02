import { searchParts, searchStores, getCategories, getManufacturers } from './repository'
import { searchQuerySchema } from './validators'
import { db } from '@/db'
import { searchHistory } from '@/db/schema'
import { searchCache, getSearchCacheKey } from '@/lib/cache'
import { logger } from '@/lib/logger'

export async function searchAll(params: unknown, userId?: string) {
  const startTime = Date.now()
  const { q, type, page, limit, ...rawFilters } = searchQuerySchema.parse(params)

  if (userId) {
    await db.insert(searchHistory).values({
      id: crypto.randomUUID(),
      userId,
      query: q,
      filters: JSON.stringify(rawFilters),
      createdAt: new Date(),
    })
  }

  if (type === 'stores') {
    const results = await searchStores(q)
    const duration = Date.now() - startTime
    logger.search(q, results.length, duration)
    return { type: 'stores', results, page, limit }
  }

  const partsResult = await searchParts({
    q,
    page,
    limit,
    categoryId: rawFilters.categoryId,
    manufacturerId: rawFilters.manufacturerId,
    city: rawFilters.city,
    inStockOnly: rawFilters.inStockOnly,
    minPrice: rawFilters.minPrice,
    maxPrice: rawFilters.maxPrice,
    origin: rawFilters.origin,
    condition: rawFilters.condition,
    vehicleId: rawFilters.vehicleId,
    sortBy: rawFilters.sortBy,
    sortOrder: rawFilters.sortOrder,
  })

  const duration = Date.now() - startTime
  logger.search(q, partsResult.total, duration)

  return { type: 'parts', ...partsResult }
}

export async function searchPartsService(params: unknown) {
  try {
    const parsed = searchQuerySchema.parse(params)
    const cacheKey = getSearchCacheKey(parsed)

    const cached = searchCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const startTime = Date.now()
    const result = await searchParts({
      q: parsed.q,
      categoryId: parsed.categoryId,
      manufacturerId: parsed.manufacturerId,
      city: parsed.city,
      inStockOnly: parsed.inStockOnly,
      minPrice: parsed.minPrice,
      maxPrice: parsed.maxPrice,
      origin: parsed.origin,
      condition: parsed.condition,
      vehicleId: parsed.vehicleId,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
      page: parsed.page,
      limit: parsed.limit,
    })

    const duration = Date.now() - startTime
    logger.search(parsed.q, result.total, duration)

    searchCache.set(cacheKey, result)

    return result
  } catch (error) {
    logger.error('Search failed', error as Error)
    return { results: [], total: 0, page: 1, limit: 20 }
  }
}

export async function getCategoriesService() {
  return getCategories()
}

export async function getManufacturersService() {
  return getManufacturers()
}
