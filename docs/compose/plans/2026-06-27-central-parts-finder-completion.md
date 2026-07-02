# Central Parts Finder - Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Central Parts Finder app by fixing all gaps in search quality, admin management, code organization, UI/UX, and adding system features.

**Architecture:** Follow existing feature-module pattern with router/service/repository layers. Prioritize search speed, Arabic UX, and simplicity.

**Tech Stack:** Next.js 16, TypeScript strict, Tailwind CSS v4, Shadcn UI, tRPC v11, React Query, TanStack Table, Drizzle ORM, Cloudflare D1, bcryptjs, jose, Zod.

---

## Phase 1: Core Search & Database Fixes (S3)

### Task 1: Add Database Indexes

**Covers:** [S3.1]

**Files:**
- Modify: `src/db/schema/catalog.ts`
- Modify: `src/db/schema/inventory.ts`
- Modify: `src/db/schema/vehicles.ts`
- Modify: `src/db/schema/users.ts`

- [ ] **Step 1: Add indexes to parts table**

```typescript
// src/db/schema/catalog.ts - add after parts table definition
export const partsIndexes = {
  partNumberIdx: index('parts_part_number_idx').on(parts.partNumber),
  oemNumberIdx: index('parts_oem_number_idx').on(parts.oemNumber),
  nameArIdx: index('parts_name_ar_idx').on(parts.nameAr),
  nameEnIdx: index('parts_name_en_idx').on(parts.nameEn),
  brandIdx: index('parts_brand_idx').on(parts.brand),
  manufacturerIdIdx: index('parts_manufacturer_id_idx').on(parts.manufacturerId),
  categoryIdIdx: index('parts_category_id_idx').on(parts.categoryId),
}
```

- [ ] **Step 2: Add indexes to inventory table**

```typescript
// src/db/schema/inventory.ts - add after inventory table definition
export const inventoryIndexes = {
  storeIdIdx: index('inventory_store_id_idx').on(inventory.storeId),
  partIdIdx: index('inventory_part_id_idx').on(inventory.partId),
  priceIdx: index('inventory_price_idx').on(inventory.price),
  quantityIdx: index('inventory_quantity_idx').on(inventory.quantity),
}
```

- [ ] **Step 3: Add indexes to vehicles table**

```typescript
// src/db/schema/vehicles.ts - add after vehicles table definition
export const vehiclesIndexes = {
  makeIdx: index('vehicles_make_idx').on(vehicles.make),
  modelIdx: index('vehicles_model_idx').on(vehicles.model),
  yearIdx: index('vehicles_year_idx').on(vehicles.year),
}
```

- [ ] **Step 4: Add indexes to users table**

```typescript
// src/db/schema/users.ts - add after users table definition
export const usersIndexes = {
  emailIdx: index('users_email_idx').on(users.email),
  roleIdx: index('users_role_idx').on(users.role),
  cityIdx: index('users_city_idx').on(users.city),
}
```

- [ ] **Step 5: Generate and run migration**

```bash
npm run db:generate
npm run db:push
```

- [ ] **Step 6: Commit**

```bash
git add src/db/schema/
git commit -m "feat: add database indexes for search performance"
```

### Task 2: Implement Arabic Text Normalization

**Covers:** [S3.2]

**Files:**
- Create: `src/lib/search/normalize.ts`
- Modify: `src/features/search/repository.ts`

- [ ] **Step 1: Write Arabic normalization utility**

```typescript
// src/lib/search/normalize.ts
export function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآ]/g, 'ا')      // Alef variants → Alef
    .replace(/ة/g, 'ه')          // Ta Marbuta → Ha
    .replace(/ى/g, 'ي')          // Alef Maqsura → Ya
    .replace(/ؤ/g, 'ء')          // Hamza below → Hamza
    .replace(/ئ/g, 'ء')          // Hamza above → Hamza
    .replace(/ـ/g, '')           // Tatweel → remove
    .replace(/\s+/g, ' ')        // Multiple spaces → single space
    .trim()
}

export function normalizeSearchQuery(query: string): string {
  const normalized = normalizeArabic(query)
  return normalized
    .split(' ')
    .filter(word => word.length > 0)
    .join(' ')
}
```

- [ ] **Step 2: Write test for normalization**

```typescript
// src/lib/search/__tests__/normalize.test.ts
import { normalizeArabic, normalizeSearchQuery } from '../normalize'

describe('Arabic normalization', () => {
  it('normalizes alef variants', () => {
    expect(normalizeArabic('أحمد')).toBe('احمد')
    expect(normalizeArabic('إسماعيل')).toBe('اسماعيل')
    expect(normalizeArabic('آدم')).toBe('ادم')
  })

  it('normalizes ta marbuta', () => {
    expect(normalizeArabic('بكرة')).toBe('بكره')
    expect(normalizeArabic('مكتبة')).toBe('مكتبه')
  })

  it('normalizes alef maqsura', () => {
    expect(normalizeArabic('عليى')).toBe('عليي')
  })

  it('removes tatweel', () => {
    expect(normalizeArabic('بــ')).toBe('ب')
  })

  it('normalizes search queries', () => {
    expect(normalizeSearchQuery('بكرة  دينمو')).toBe('بكره دينمو')
  })
})
```

- [ ] **Step 3: Run test to verify it passes**

```bash
npm test -- src/lib/search/__tests__/normalize.test.ts
```

- [ ] **Step 4: Update search repository to use normalization**

```typescript
// src/features/search/repository.ts - modify searchParts function
import { normalizeSearchQuery } from '@/lib/search/normalize'

export async function searchParts(params: SearchPartsParams) {
  const { q, page = 1, limit = 12, ...filters } = params
  const normalizedQuery = normalizeSearchQuery(q)
  
  // Use normalizedQuery in ILIKE searches
  const conditions = [
    or(
      ilike(parts.partNumber, `%${normalizedQuery}%`),
      ilike(parts.oemNumber, `%${normalizedQuery}%`),
      ilike(parts.nameAr, `%${normalizedQuery}%`),
      ilike(parts.nameEn, `%${normalizedQuery}%`),
      ilike(parts.brand, `%${normalizedQuery}%`),
      ilike(parts.tags, `%${normalizedQuery}%`),
    )
  ]
  
  // ... rest of existing code
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/search/ src/features/search/repository.ts
git commit -m "feat: add Arabic text normalization for search"
```

### Task 3: Add Search Ranking

**Covers:** [S3.3]

**Files:**
- Modify: `src/features/search/repository.ts`
- Create: `src/lib/search/ranking.ts`

- [ ] **Step 1: Create search ranking utility**

```typescript
// src/lib/search/ranking.ts
export function calculateSearchScore(
  query: string,
  part: {
    partNumber: string
    oemNumber: string | null
    nameAr: string
    nameEn: string | null
    brand: string | null
    alternativeNames: string | null
  }
): number {
  const normalizedQuery = query.toLowerCase()
  let score = 0

  // Exact part number match (highest priority)
  if (part.partNumber.toLowerCase() === normalizedQuery) {
    score += 100
  } else if (part.partNumber.toLowerCase().includes(normalizedQuery)) {
    score += 80
  }

  // Exact OEM number match
  if (part.oemNumber?.toLowerCase() === normalizedQuery) {
    score += 90
  } else if (part.oemNumber?.toLowerCase().includes(normalizedQuery)) {
    score += 70
  }

  // Exact name match
  if (part.nameAr.toLowerCase().includes(normalizedQuery)) {
    score += 60
  }
  if (part.nameEn?.toLowerCase().includes(normalizedQuery)) {
    score += 50
  }

  // Brand match
  if (part.brand?.toLowerCase().includes(normalizedQuery)) {
    score += 40
  }

  // Alternative names match
  if (part.alternativeNames) {
    try {
      const alternatives = JSON.parse(part.alternativeNames)
      if (Array.isArray(alternatives)) {
        for (const alt of alternatives) {
          if (alt.toLowerCase().includes(normalizedQuery)) {
            score += 30
            break
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  return score
}
```

- [ ] **Step 2: Update search repository to use ranking**

```typescript
// src/features/search/repository.ts - modify searchParts function
import { calculateSearchScore } from '@/lib/search/ranking'

export async function searchParts(params: SearchPartsParams) {
  // ... existing code to fetch parts
  
  // After fetching parts, calculate scores and sort
  const scoredParts = parts.map(part => ({
    part,
    score: calculateSearchScore(q, part),
  }))

  // Sort by score descending
  scoredParts.sort((a, b) => b.score - a.score)

  // Paginate
  const offset = (page - 1) * limit
  const paginatedParts = scoredParts.slice(offset, offset + limit)

  return {
    results: paginatedParts.map(({ part, score }) => ({
      part,
      score,
      // ... other fields
    })),
    total: scoredParts.length,
    page,
    limit,
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/search/ranking.ts src/features/search/repository.ts
git commit -m "feat: add search ranking for exact matches"
```

### Task 4: Fix Ignored Search Filters

**Covers:** [S3.4]

**Files:**
- Modify: `src/features/search/repository.ts`
- Modify: `src/features/search/validators.ts`

- [ ] **Step 1: Update search repository to use all filters**

```typescript
// src/features/search/repository.ts - modify searchParts function
export async function searchParts(params: SearchPartsParams) {
  const { 
    q, page = 1, limit = 12, 
    categoryId, manufacturerId, city, inStockOnly,
    minPrice, maxPrice, origin, condition, vehicleId,
    sortBy, sortOrder
  } = params

  const normalizedQuery = normalizeSearchQuery(q)
  
  const conditions = []

  // Text search conditions
  conditions.push(
    or(
      ilike(parts.partNumber, `%${normalizedQuery}%`),
      ilike(parts.oemNumber, `%${normalizedQuery}%`),
      ilike(parts.nameAr, `%${normalizedQuery}%`),
      ilike(parts.nameEn, `%${normalizedQuery}%`),
      ilike(parts.brand, `%${normalizedQuery}%`),
    )
  )

  // Filter conditions
  if (categoryId) {
    conditions.push(eq(parts.categoryId, categoryId))
  }
  if (manufacturerId) {
    conditions.push(eq(parts.manufacturerId, manufacturerId))
  }
  if (origin) {
    conditions.push(eq(parts.origin, origin))
  }
  if (condition) {
    conditions.push(eq(inventory.condition, condition))
  }

  // Price filters (via inventory)
  if (minPrice) {
    conditions.push(gte(inventory.price, minPrice))
  }
  if (maxPrice) {
    conditions.push(lte(inventory.price, maxPrice))
  }

  // Stock filter
  if (inStockOnly) {
    conditions.push(gt(inventory.quantity, 0))
  }

  // City filter (via store)
  if (city) {
    conditions.push(eq(stores.city, city))
  }

  // Vehicle compatibility filter
  if (vehicleId) {
    conditions.push(
      inArray(parts.id, 
        db.select({ partId: compatibility.partId })
          .from(compatibility)
          .where(eq(compatibility.vehicleId, vehicleId))
      )
    )
  }

  // ... rest of query building
}
```

- [ ] **Step 2: Update validators to ensure all filters are passed**

```typescript
// src/features/search/validators.ts - ensure all filters are in schema
export const searchQuerySchema = z.object({
  q: z.string().min(1),
  type: z.enum(['parts', 'stores']).default('parts'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(12),
  categoryId: z.string().optional(),
  manufacturerId: z.string().optional(),
  city: z.string().optional(),
  inStockOnly: z.boolean().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  origin: z.string().optional(),
  condition: z.enum(['new', 'used', 'refurbished', 'salvage']).optional(),
  vehicleId: z.string().optional(),
  sortBy: z.enum(['price', 'relevance', 'distance', 'quantity']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
```

- [ ] **Step 3: Commit**

```bash
git add src/features/search/repository.ts src/features/search/validators.ts
git commit -m "feat: implement all search filters"
```

### Task 5: Add Result Sorting

**Covers:** [S3.5]

**Files:**
- Modify: `src/features/search/repository.ts`
- Create: `src/lib/search/sorting.ts`

- [ ] **Step 1: Create sorting utility**

```typescript
// src/lib/search/sorting.ts
export type SortBy = 'price' | 'relevance' | 'distance' | 'quantity'
export type SortOrder = 'asc' | 'desc'

export function sortResults<T extends Record<string, unknown>>(
  results: T[],
  sortBy: SortBy,
  sortOrder: SortOrder,
  userLocation?: { lat: number; lng: number }
): T[] {
  return [...results].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'price':
        comparison = (a.price as number) - (b.price as number)
        break
      case 'quantity':
        comparison = (a.quantity as number) - (b.quantity as number)
        break
      case 'distance':
        if (userLocation && a.storeLat && a.storeLng && b.storeLat && b.storeLng) {
          const distA = calculateDistance(userLocation, { lat: a.storeLat as number, lng: a.storeLng as number })
          const distB = calculateDistance(userLocation, { lat: b.storeLat as number, lng: b.storeLng as number })
          comparison = distA - distB
        }
        break
      case 'relevance':
      default:
        comparison = (b.score as number) - (a.score as number)
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })
}

function calculateDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371 // Earth's radius in km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
```

- [ ] **Step 2: Update search repository to use sorting**

```typescript
// src/features/search/repository.ts - add sorting after ranking
import { sortResults, SortBy, SortOrder } from '@/lib/search/sorting'

export async function searchParts(params: SearchPartsParams) {
  // ... existing code
  
  // After scoring and filtering
  const sortedResults = sortResults(
    scoredParts,
    sortBy as SortBy,
    sortOrder as SortOrder,
    userLocation // from user session if available
  )

  // Paginate sorted results
  const offset = (page - 1) * limit
  const paginatedResults = sortedResults.slice(offset, offset + limit)

  return {
    results: paginatedResults,
    total: sortedResults.length,
    page,
    limit,
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/search/sorting.ts src/features/search/repository.ts
git commit -m "feat: add search result sorting"
```

### Task 6: Populate SearchVector Field

**Covers:** [S3.6]

**Files:**
- Modify: `src/features/parts/services.ts`
- Modify: `src/features/search/repository.ts`

- [ ] **Step 1: Add search vector generation**

```typescript
// src/features/parts/services.ts - add to part creation/update
import { normalizeSearchQuery } from '@/lib/search/normalize'

export function generateSearchVector(part: {
  partNumber: string
  oemNumber: string | null
  nameAr: string
  nameEn: string | null
  brand: string | null
  alternativeNames: string | null
  tags: string | null
}): string {
  const components = [
    part.partNumber,
    part.oemNumber,
    part.nameAr,
    part.nameEn,
    part.brand,
    part.alternativeNames,
    part.tags,
  ].filter(Boolean)

  return components
    .map(comp => normalizeSearchQuery(comp!))
    .join(' ')
}

// Update createPart and updatePart functions to populate searchVector
export async function createPart(data: CreatePartInput) {
  const searchVector = generateSearchVector(data)
  
  return db.insert(parts).values({
    ...data,
    searchVector,
    // ... other fields
  })
}
```

- [ ] **Step 2: Update search to use searchVector**

```typescript
// src/features/search/repository.ts - add searchVector search
export async function searchParts(params: SearchPartsParams) {
  const normalizedQuery = normalizeSearchQuery(q)
  
  const conditions = [
    or(
      // ... existing ILIKE conditions
      ilike(parts.searchVector, `%${normalizedQuery}%`), // Add this
    )
  ]
  
  // ... rest of code
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/parts/services.ts src/features/search/repository.ts
git commit -m "feat: populate and use searchVector field"
```

### Task 7: Add Search Result Caching

**Covers:** [S3.7]

**Files:**
- Create: `src/lib/cache.ts`
- Modify: `src/features/search/services.ts`

- [ ] **Step 1: Create simple in-memory cache**

```typescript
// src/lib/cache.ts
interface CacheEntry<T> {
  data: T
  expiry: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, { data, expiry })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }
    return entry.data as T
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}

export const searchCache = new MemoryCache()

export function getSearchCacheKey(params: Record<string, unknown>): string {
  return `search:${JSON.stringify(params)}`
}
```

- [ ] **Step 2: Update search service to use cache**

```typescript
// src/features/search/services.ts
import { searchCache, getSearchCacheKey } from '@/lib/cache'

export async function searchPartsService(params: unknown) {
  const parsed = searchQuerySchema.parse(params)
  const cacheKey = getSearchCacheKey(parsed)
  
  // Check cache first
  const cached = searchCache.get(cacheKey)
  if (cached) {
    return cached
  }
  
  // Execute search
  const result = await searchParts({
    q: parsed.q,
    categoryId: parsed.categoryId,
    manufacturerId: parsed.manufacturerId,
    city: parsed.city,
    inStockOnly: parsed.inStockOnly,
    page: parsed.page,
    limit: parsed.limit,
  })
  
  // Cache result for 5 minutes
  searchCache.set(cacheKey, result)
  
  return result
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/cache.ts src/features/search/services.ts
git commit -m "feat: add search result caching"
```

## Phase 2: Admin & Management Pages (S4)

### Task 8: Category CRUD Page

**Covers:** [S4.1]

**Files:**
- Modify: `src/app/admin/categories/page.tsx`
- Modify: `src/features/admin/router.ts`
- Modify: `src/features/admin/services.ts`
- Modify: `src/features/admin/repository.ts`

- [ ] **Step 1: Add category CRUD endpoints to admin router**

```typescript
// src/features/admin/router.ts - add to adminRouter
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().min(1),
  slug: z.string().min(1),
  parentId: z.string().optional(),
})

export const adminRouter = {
  // ... existing endpoints
  
  listCategories: protectedProcedure
    .query(async () => {
      return adminService.listCategories()
    }),
  
  createCategory: protectedProcedure
    .input(categorySchema)
    .mutation(async ({ input }) => {
      return adminService.createCategory(input)
    }),
  
  updateCategory: protectedProcedure
    .input(z.object({ id: z.string(), ...categorySchema.shape }))
    .mutation(async ({ input }) => {
      return adminService.updateCategory(input.id, input)
    }),
  
  deleteCategory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return adminService.deleteCategory(input.id)
    }),
}
```

- [ ] **Step 2: Add category CRUD to admin service**

```typescript
// src/features/admin/services.ts
export async function listCategories() {
  return adminRepository.listCategories()
}

export async function createCategory(data: CreateCategoryInput) {
  return adminRepository.createCategory(data)
}

export async function updateCategory(id: string, data: UpdateCategoryInput) {
  return adminRepository.updateCategory(id, data)
}

export async function deleteCategory(id: string) {
  return adminRepository.deleteCategory(id)
}
```

- [ ] **Step 3: Add category CRUD to admin repository**

```typescript
// src/features/admin/repository.ts
export async function listCategories() {
  return db.select().from(categories).orderBy(categories.nameAr)
}

export async function createCategory(data: CreateCategoryInput) {
  return db.insert(categories).values(data).returning()
}

export async function updateCategory(id: string, data: UpdateCategoryInput) {
  return db.update(categories).set(data).where(eq(categories.id, id)).returning()
}

export async function deleteCategory(id: string) {
  return db.delete(categories).where(eq(categories.id, id))
}
```

- [ ] **Step 4: Update admin categories page**

```typescript
// src/app/admin/categories/page.tsx - replace stub with full CRUD
'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'

export default function CategoriesPage() {
  const { t } = useLanguage()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', nameAr: '', slug: '' })
  
  const { data: categories, refetch } = trpc.admin.listCategories.useQuery()
  const createMutation = trpc.admin.createCategory.useMutation({ onSuccess: () => refetch() })
  const updateMutation = trpc.admin.updateCategory.useMutation({ onSuccess: () => refetch() })
  const deleteMutation = trpc.admin.deleteCategory.useMutation({ onSuccess: () => refetch() })
  
  const handleSubmit = async () => {
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...formData })
    } else {
      await createMutation.mutateAsync(formData)
    }
    setEditingId(null)
    setFormData({ name: '', nameAr: '', slug: '' })
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('categories')}</h1>
      
      {/* Form */}
      <div className="mb-6 rounded-xl border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            placeholder={t('categoryNameAr')}
            value={formData.nameAr}
            onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
            className="rounded-lg border px-3 py-2"
          />
          <input
            placeholder={t('categoryNameEn')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="rounded-lg border px-3 py-2"
          />
          <input
            placeholder={t('slug')}
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="rounded-lg border px-3 py-2"
          />
        </div>
        <button
          onClick={handleSubmit}
          className="mt-4 rounded-lg bg-foreground px-4 py-2 text-sm text-background"
        >
          {editingId ? t('update') : t('create')}
        </button>
      </div>
      
      {/* List */}
      <div className="rounded-xl border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-right">{t('categoryNameAr')}</th>
              <th className="p-3 text-right">{t('categoryNameEn')}</th>
              <th className="p-3 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {categories?.map((cat) => (
              <tr key={cat.id} className="border-b">
                <td className="p-3">{cat.nameAr}</td>
                <td className="p-3">{cat.name}</td>
                <td className="p-3">
                  <button
                    onClick={() => {
                      setEditingId(cat.id)
                      setFormData({ name: cat.name, nameAr: cat.nameAr, slug: cat.slug })
                    }}
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate({ id: cat.id })}
                    className="text-red-600 hover:underline"
                  >
                    {t('delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/ src/app/admin/categories/
git commit -m "feat: add category CRUD page"
```

### Task 9: Manufacturer CRUD Page

**Covers:** [S4.2]

**Files:**
- Modify: `src/app/admin/manufacturers/page.tsx`
- Modify: `src/features/admin/router.ts`
- Modify: `src/features/admin/services.ts`
- Modify: `src/features/admin/repository.ts`

- [ ] **Step 1: Add manufacturer CRUD endpoints**

```typescript
// src/features/admin/router.ts - add to adminRouter
const manufacturerSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().min(1),
  slug: z.string().min(1),
  country: z.string().optional(),
})

export const adminRouter = {
  // ... existing endpoints
  
  listManufacturers: protectedProcedure
    .query(async () => {
      return adminService.listManufacturers()
    }),
  
  createManufacturer: protectedProcedure
    .input(manufacturerSchema)
    .mutation(async ({ input }) => {
      return adminService.createManufacturer(input)
    }),
  
  updateManufacturer: protectedProcedure
    .input(z.object({ id: z.string(), ...manufacturerSchema.shape }))
    .mutation(async ({ input }) => {
      return adminService.updateManufacturer(input.id, input)
    }),
  
  deleteManufacturer: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return adminService.deleteManufacturer(input.id)
    }),
}
```

- [ ] **Step 2: Add manufacturer CRUD to service and repository**

```typescript
// src/features/admin/services.ts
export async function listManufacturers() {
  return adminRepository.listManufacturers()
}

export async function createManufacturer(data: CreateManufacturerInput) {
  return adminRepository.createManufacturer(data)
}

export async function updateManufacturer(id: string, data: UpdateManufacturerInput) {
  return adminRepository.updateManufacturer(id, data)
}

export async function deleteManufacturer(id: string) {
  return adminRepository.deleteManufacturer(id)
}

// src/features/admin/repository.ts
export async function listManufacturers() {
  return db.select().from(manufacturers).orderBy(manufacturers.nameAr)
}

export async function createManufacturer(data: CreateManufacturerInput) {
  return db.insert(manufacturers).values(data).returning()
}

export async function updateManufacturer(id: string, data: UpdateManufacturerInput) {
  return db.update(manufacturers).set(data).where(eq(manufacturers.id, id)).returning()
}

export async function deleteManufacturer(id: string) {
  return db.delete(manufacturers).where(eq(manufacturers.id, id))
}
```

- [ ] **Step 3: Update manufacturers page with full CRUD**

```typescript
// src/app/admin/manufacturers/page.tsx - similar to categories page
// ... (full implementation follows same pattern as Task 8)
```

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/ src/app/admin/manufacturers/
git commit -m "feat: add manufacturer CRUD page"
```

### Task 10: Store Rejection Workflow

**Covers:** [S4.3]

**Files:**
- Modify: `src/features/admin/router.ts`
- Modify: `src/features/admin/services.ts`
- Modify: `src/features/admin/repository.ts`
- Modify: `src/app/admin/stores/page.tsx`

- [ ] **Step 1: Add store rejection endpoint**

```typescript
// src/features/admin/router.ts
rejectStore: protectedProcedure
  .input(z.object({ 
    storeId: z.string(), 
    reason: z.string().min(1) 
  }))
  .mutation(async ({ input }) => {
    return adminService.rejectStore(input.storeId, input.reason)
  }),
```

- [ ] **Step 2: Add rejection to service and repository**

```typescript
// src/features/admin/services.ts
export async function rejectStore(storeId: string, reason: string) {
  // Update store status to rejected
  await adminRepository.updateStoreStatus(storeId, 'rejected')
  
  // Log the rejection
  await adminRepository.createAuditLog({
    action: 'store_rejected',
    entityType: 'store',
    entityId: storeId,
    details: { reason },
  })
  
  return { success: true }
}

// src/features/admin/repository.ts
export async function updateStoreStatus(storeId: string, status: StoreStatus) {
  return db.update(stores)
    .set({ status, updatedAt: new Date() })
    .where(eq(stores.id, storeId))
}
```

- [ ] **Step 3: Add reject button to admin stores page**

```typescript
// src/app/admin/stores/page.tsx - add reject button
const [rejectReason, setRejectReason] = useState('')
const [rejectingStoreId, setRejectingStoreId] = useState<string | null>(null)

const rejectMutation = trpc.admin.rejectStore.useMutation({
  onSuccess: () => {
    refetch()
    setRejectingStoreId(null)
    setRejectReason('')
  }
})

// In the table rows, add reject button
{store.status === 'pending' && (
  <>
    <button
      onClick={() => verifyMutation.mutate({ storeId: store.id })}
      className="text-green-600 hover:underline"
    >
      {t('verify')}
    </button>
    <button
      onClick={() => setRejectingStoreId(store.id)}
      className="text-red-600 hover:underline"
    >
      {t('reject')}
    </button>
  </>
)}

// Add reject modal
{rejectingStoreId && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-background rounded-xl p-6 max-w-md">
      <h3 className="text-lg font-bold mb-4">{t('rejectStore')}</h3>
      <textarea
        value={rejectReason}
        onChange={(e) => setRejectReason(e.target.value)}
        placeholder={t('rejectionReason')}
        className="w-full rounded-lg border px-3 py-2 mb-4"
        rows={3}
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setRejectingStoreId(null)}
          className="rounded-lg border px-4 py-2"
        >
          {t('cancel')}
        </button>
        <button
          onClick={() => rejectMutation.mutate({ storeId: rejectingStoreId, reason: rejectReason })}
          disabled={!rejectReason}
          className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {t('confirmReject')}
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/ src/app/admin/stores/
git commit -m "feat: add store rejection workflow"
```

### Task 11: Subscription Management UI

**Covers:** [S4.4, S4.5, S4.6]

**Files:**
- Create: `src/app/admin/subscriptions/page.tsx`
- Modify: `src/features/admin/router.ts`
- Create: `src/features/subscriptions/` (router, services, repository)

- [ ] **Step 1: Create subscription feature module**

```typescript
// src/features/subscriptions/types.ts
export type SubscriptionPlan = 'basic' | 'premium' | 'enterprise'
export type PaymentMethod = 'cash' | 'zain_cash' | 'qi_card' | 'fast_pay' | 'bank_transfer'

export interface Subscription {
  id: string
  storeId: string
  plan: SubscriptionPlan
  status: 'active' | 'pending' | 'cancelled'
  paymentMethod: PaymentMethod
  amount: number
  discount: number
  startDate: Date
  endDate: Date
}

export interface SubscriptionPlanDetails {
  plan: SubscriptionPlan
  name: string
  nameAr: string
  price: number
  features: string[]
  inventoryLimit: number
}
```

- [ ] **Step 2: Create subscription plans configuration**

```typescript
// src/features/subscriptions/plans.ts
export const subscriptionPlans: SubscriptionPlanDetails[] = [
  {
    plan: 'basic',
    name: 'Basic',
    nameAr: 'أساسي',
    price: 50000, // 50,000 IQD
    features: ['100 inventory items', 'Basic search', 'Store profile'],
    inventoryLimit: 100,
  },
  {
    plan: 'premium',
    name: 'Premium',
    nameAr: 'مميز',
    price: 150000, // 150,000 IQD
    features: ['500 inventory items', 'Priority search', 'Analytics', 'Multiple photos'],
    inventoryLimit: 500,
  },
  {
    plan: 'enterprise',
    name: 'Enterprise',
    nameAr: 'مؤسسات',
    price: 500000, // 500,000 IQD
    features: ['Unlimited inventory', 'Top search ranking', 'Advanced analytics', 'API access'],
    inventoryLimit: Infinity,
  },
]
```

- [ ] **Step 3: Add subscription admin endpoints**

```typescript
// src/features/admin/router.ts
listSubscriptions: protectedProcedure
  .query(async () => {
    return adminService.listSubscriptions()
  }),

updateSubscriptionPlan: protectedProcedure
  .input(z.object({
    plan: z.enum(['basic', 'premium', 'enterprise']),
    price: z.number().positive(),
    features: z.array(z.string()),
    inventoryLimit: z.number(),
  }))
  .mutation(async ({ input }) => {
    return adminService.updateSubscriptionPlan(input)
  }),

setDiscount: protectedProcedure
  .input(z.object({
    subscriptionId: z.string(),
    discountPercent: z.number().min(0).max(100),
  }))
  .mutation(async ({ input }) => {
    return adminService.setDiscount(input.subscriptionId, input.discountPercent)
  }),

configurePaymentMethods: protectedProcedure
  .input(z.object({
    methods: z.array(z.enum(['cash', 'zain_cash', 'qi_card', 'fast_pay', 'bank_transfer'])),
    enabled: z.boolean(),
  }))
  .mutation(async ({ input }) => {
    return adminService.configurePaymentMethods(input.methods, input.enabled)
  }),
```

- [ ] **Step 4: Create admin subscriptions page**

```typescript
// src/app/admin/subscriptions/page.tsx
'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'
import { subscriptionPlans } from '@/features/subscriptions/plans'

export default function SubscriptionsPage() {
  const { t } = useLanguage()
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  
  const { data: subscriptions, refetch } = trpc.admin.listSubscriptions.useQuery()
  const updatePlanMutation = trpc.admin.updateSubscriptionPlan.useMutation({ onSuccess: () => refetch() })
  const setDiscountMutation = trpc.admin.setDiscount.useMutation({ onSuccess: () => refetch() })
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('subscriptionManagement')}</h1>
      
      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {subscriptionPlans.map((plan) => (
          <div key={plan.plan} className="rounded-xl border p-6">
            <h3 className="text-lg font-bold">{plan.nameAr}</h3>
            <p className="text-2xl font-bold mt-2">{plan.price.toLocaleString()} IQD</p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="text-sm text-muted-foreground">• {feature}</li>
              ))}
            </ul>
            <button
              onClick={() => setEditingPlan(plan.plan)}
              className="mt-4 rounded-lg border px-4 py-2 text-sm"
            >
              {t('editPlan')}
            </button>
          </div>
        ))}
      </div>
      
      {/* Active Subscriptions */}
      <h2 className="text-xl font-bold mb-4">{t('activeSubscriptions')}</h2>
      <div className="rounded-xl border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-right">{t('store')}</th>
              <th className="p-3 text-right">{t('plan')}</th>
              <th className="p-3 text-right">{t('status')}</th>
              <th className="p-3 text-right">{t('discount')}</th>
              <th className="p-3 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions?.map((sub) => (
              <tr key={sub.id} className="border-b">
                <td className="p-3">{sub.store?.nameAr}</td>
                <td className="p-3">{sub.plan}</td>
                <td className="p-3">{sub.status}</td>
                <td className="p-3">{sub.discount}%</td>
                <td className="p-3">
                  <button
                    onClick={() => {
                      const newDiscount = prompt(t('enterDiscount'))
                      if (newDiscount) {
                        setDiscountMutation.mutate({
                          subscriptionId: sub.id,
                          discountPercent: parseInt(newDiscount),
                        })
                      }
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    {t('setDiscount')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/features/subscriptions/ src/app/admin/subscriptions/
git commit -m "feat: add subscription management UI"
```

### Task 12: Multiple Manufacturers per Store

**Covers:** [S4.7]

**Files:**
- Modify: `src/db/schema/users.ts`
- Create: `src/db/schema/store-manufacturers.ts`
- Modify: `src/features/stores/services.ts`

- [ ] **Step 1: Create store-manufacturers join table**

```typescript
// src/db/schema/store-manufacturers.ts
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { stores } from './users'
import { manufacturers } from './catalog'

export const storeManufacturers = sqliteTable('store_manufacturers', {
  storeId: text('store_id').references(() => stores.id),
  manufacturerId: text('manufacturer_id').references(() => manufacturers.id),
})

export const storeManufacturerRelations = relations(storeManufacturers, ({ one }) => ({
  store: one(stores, { fields: [storeManufacturers.storeId], references: [stores.id] }),
  manufacturer: one(manufacturers, { fields: [storeManufacturers.manufacturerId], references: [manufacturers.id] }),
}))
```

- [ ] **Step 2: Update store service to handle multiple manufacturers**

```typescript
// src/features/stores/services.ts
export async function updateStoreManufacturers(storeId: string, manufacturerIds: string[]) {
  // Delete existing relations
  await db.delete(storeManufacturers).where(eq(storeManufacturers.storeId, storeId))
  
  // Insert new relations
  if (manufacturerIds.length > 0) {
    await db.insert(storeManufacturers).values(
      manufacturerIds.map(manufacturerId => ({
        storeId,
        manufacturerId,
      }))
    )
  }
}

export async function getStoreManufacturers(storeId: string) {
  return db.select({ manufacturerId: storeManufacturers.manufacturerId })
    .from(storeManufacturers)
    .where(eq(storeManufacturers.storeId, storeId))
}
```

- [ ] **Step 3: Update store settings UI to allow multiple manufacturer selection**

```typescript
// src/app/dashboard/settings/page.tsx - add manufacturer multi-select
const { data: allManufacturers } = trpc.search.manufacturers.useQuery()
const { data: storeManufacturers } = trpc.stores.getManufacturers.useQuery({ storeId })

const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>(
  storeManufacturers?.map(sm => sm.manufacturerId) || []
)

// Add multi-select UI
<div className="mb-4">
  <label className="block text-sm font-medium mb-2">{t('manufacturers')}</label>
  <div className="flex flex-wrap gap-2">
    {allManufacturers?.map((m) => (
      <button
        key={m.id}
        onClick={() => {
          if (selectedManufacturers.includes(m.id)) {
            setSelectedManufacturers(selectedManufacturers.filter(id => id !== m.id))
          } else {
            setSelectedManufacturers([...selectedManufacturers, m.id])
          }
        }}
        className={`rounded-lg border px-3 py-1.5 text-sm ${
          selectedManufacturers.includes(m.id) ? 'bg-foreground text-background' : ''
        }`}
      >
        {m.nameAr}
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/db/schema/store-manufacturers.ts src/features/stores/ src/app/dashboard/settings/
git commit -m "feat: support multiple manufacturers per store"
```

### Task 13: Store Settings Editing

**Covers:** [S4.8]

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`
- Modify: `src/features/stores/router.ts`
- Modify: `src/features/stores/services.ts`

- [ ] **Step 1: Add store update endpoints**

```typescript
// src/features/stores/router.ts
updateProfile: protectedProcedure
  .input(z.object({
    storeId: z.string(),
    nameAr: z.string().min(1),
    nameEn: z.string().min(1),
    description: z.string().optional(),
    address: z.string().min(1),
    phone: z.string().min(1),
    whatsapp: z.string().optional(),
    workingHours: z.string().optional(),
    gpsLat: z.number().optional(),
    gpsLng: z.number().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    // Verify store ownership
    const store = await storeService.getStoreById(input.storeId)
    if (!store || store.ownerId !== ctx.userId) {
      throw new Error('Unauthorized')
    }
    return storeService.updateStore(input.storeId, input)
  }),
```

- [ ] **Step 2: Update settings page with edit form**

```typescript
// src/app/dashboard/settings/page.tsx - replace view-only with edit form
'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'

export default function SettingsPage() {
  const { t } = useLanguage()
  const { data: session } = trpc.auth.me.useQuery()
  const { data: store, refetch } = trpc.stores.getByOwner.useQuery()
  
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    description: '',
    address: '',
    phone: '',
    whatsapp: '',
    workingHours: '',
    gpsLat: 0,
    gpsLng: 0,
  })
  
  useEffect(() => {
    if (store) {
      setFormData({
        nameAr: store.nameAr,
        nameEn: store.nameEn,
        description: store.description || '',
        address: store.address,
        phone: store.phone,
        whatsapp: store.whatsapp || '',
        workingHours: store.workingHours || '',
        gpsLat: store.gpsLat || 0,
        gpsLng: store.gpsLng || 0,
      })
    }
  }, [store])
  
  const updateMutation = trpc.stores.updateProfile.useMutation({
    onSuccess: () => refetch()
  })
  
  const handleSubmit = async () => {
    if (!store) return
    await updateMutation.mutateAsync({
      storeId: store.id,
      ...formData,
    })
  }
  
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t('storeSettings')}</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('storeNameAr')}</label>
          <input
            value={formData.nameAr}
            onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">{t('storeNameEn')}</label>
          <input
            value={formData.nameEn}
            onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">{t('description')}</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-lg border px-3 py-2"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">{t('address')}</label>
          <input
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('phone')}</label>
            <input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('whatsapp')}</label>
            <input
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">{t('workingHours')}</label>
          <input
            value={formData.workingHours}
            onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
            placeholder="8:00 AM - 5:00 PM"
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          className="rounded-lg bg-foreground px-6 py-2 text-background disabled:opacity-50"
        >
          {updateMutation.isPending ? t('saving') : t('save')}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/stores/ src/app/dashboard/settings/
git commit -m "feat: add store settings editing"
```