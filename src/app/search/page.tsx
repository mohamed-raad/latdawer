'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'
import { CONDITION_LABELS, CONDITION_COLORS, IRAQI_CITIES, QUICK_SEARCH_EXAMPLES } from '@/constants'
import { FilterDrawer } from '@/features/search/components/filter-drawer'

function SearchFallback() {
  return <div className="mx-auto max-w-7xl px-4 py-6"><p className="text-muted-foreground">...</p></div>
}

export default function SearchPage() {
  return <Suspense fallback={<SearchFallback />}><SearchContent /></Suspense>
}

function SearchContent() {
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const router = useRouter()
  const qParam = searchParams.get('q') || ''

  const [query, setQuery] = useState(qParam)
  const [debouncedQuery, setDebouncedQuery] = useState(qParam)
  const [categoryId, setCategoryId] = useState('')
  const [manufacturerId, setManufacturerId] = useState('')
  const [condition, setCondition] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [city, setCity] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data: categoryData } = trpc.search.categories.useQuery()
  const { data: manufacturerData } = trpc.search.manufacturers.useQuery()

  const conditionVal = condition ? (condition as 'new' | 'used' | 'refurbished' | 'salvage') : undefined

  const { data: suggestData } = trpc.search.parts.useQuery(
    { q: query, limit: 5 },
    { enabled: query.length >= 2 }
  ) as { data: { results: Array<{ part: { id: string; nameAr: string; partNumber: string | null; brand: string | null } }> } | undefined }

  const { data, isLoading } = trpc.search.parts.useQuery(
    {
      q: debouncedQuery,
      ...(categoryId && { categoryId }),
      ...(manufacturerId && { manufacturerId }),
      ...(conditionVal && { condition: conditionVal }),
      ...(minPrice && { minPrice: Number(minPrice) }),
      ...(maxPrice && { maxPrice: Number(maxPrice) }),
      ...(city && { city }),
      ...(inStockOnly && { inStockOnly: true }),
      page,
      limit: 12,
    },
    { enabled: !!debouncedQuery },
  ) as { data: { results: Array<{ part: { id: string; nameAr: string; nameEn: string | null; partNumber: string | null; brand: string | null; condition: string | null }; minPrice: number; storeCount: number }>; total: number; limit: number } | undefined; isLoading: boolean }

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0

  const handleSearch = () => {
    if (!query) return
    router.push(`/search?q=${encodeURIComponent(query)}`)
    setPage(1)
  }

  const handleQuickSearch = (q: string) => {
    setQuery(q)
    setPage(1)
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">{t('search_')}</h1>

      <div className="relative flex gap-2 mb-4">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); if (!e.target.value) setPage(1); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') { handleSearch(); setShowSuggestions(false) } }}
          placeholder={t('searchPlaceholder')}
          className="flex-1 h-12 rounded-xl border px-4 text-lg outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <button onClick={() => { handleSearch(); setShowSuggestions(false) }} className="rounded-xl bg-foreground px-6 text-sm font-medium text-background">{t('search_')}</button>
        {showSuggestions && suggestData && suggestData.results.length > 0 && (
          <div ref={suggestionsRef} className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border bg-background shadow-lg">
            {suggestData.results.map((item) => (
              <Link
                key={item.part.id}
                href={`/parts/${item.part.id}`}
                onClick={() => setShowSuggestions(false)}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted transition-colors border-b last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{item.part.nameAr}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">{item.part.partNumber}</p>
                </div>
                {item.part.brand && <span className="mr-2 shrink-0 text-xs text-muted-foreground">{item.part.brand}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {QUICK_SEARCH_EXAMPLES.map((ex) => (
          <button
            key={ex.query}
            onClick={() => handleQuickSearch(ex.query)}
            className="rounded-lg border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            {ex.label}: {ex.query}
          </button>
        ))}
      </div>

      <FilterDrawer
        categoryId={categoryId}
        setCategoryId={setCategoryId}
        manufacturerId={manufacturerId}
        setManufacturerId={setManufacturerId}
        condition={condition}
        setCondition={setCondition}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        city={city}
        setCity={setCity}
        inStockOnly={inStockOnly}
        setInStockOnly={setInStockOnly}
        setPage={setPage}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <aside className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border p-4 space-y-4">
            <h2 className="font-bold text-sm mb-3">{t('filter')}</h2>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t('category')}</label>
              <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1) }} className="w-full rounded-lg border px-3 py-2 text-sm outline-none">
                <option value="">{t('all')}</option>
                {categoryData?.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t('manufacturer_')}</label>
              <select value={manufacturerId} onChange={(e) => { setManufacturerId(e.target.value); setPage(1) }} className="w-full rounded-lg border px-3 py-2 text-sm outline-none">
                <option value="">{t('all')}</option>
                {manufacturerData?.map((m) => <option key={m.id} value={m.id}>{m.nameAr}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t('condition')}</label>
              <select value={condition} onChange={(e) => { setCondition(e.target.value); setPage(1) }} className="w-full rounded-lg border px-3 py-2 text-sm outline-none">
                <option value="">{t('all')}</option>
                {Object.entries(CONDITION_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t('priceRange')} (IQD)</label>
              <div className="flex gap-2">
                <input type="number" placeholder={t('fromPrice')} value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1) }} className="w-full rounded-lg border px-2 py-2 text-sm outline-none" />
                <input type="number" placeholder={t('toPrice')} value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1) }} className="w-full rounded-lg border px-2 py-2 text-sm outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t('city')}</label>
              <select value={city} onChange={(e) => { setCity(e.target.value); setPage(1) }} className="w-full rounded-lg border px-3 py-2 text-sm outline-none">
                <option value="">{t('all')}</option>
                {IRAQI_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={inStockOnly} onChange={(e) => { setInStockOnly(e.target.checked); setPage(1) }} className="h-4 w-4 rounded border-gray-300" />
              <span className="text-xs font-medium">{t('inStockOnly')}</span>
            </label>
          </div>
        </aside>

        <main className="lg:col-span-3">
          {!debouncedQuery && (
            <div className="rounded-xl border p-8 text-center text-muted-foreground">{t('searchPlaceholder')}</div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl border overflow-hidden animate-pulse">
                  <div className="h-44 bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {data && !isLoading && (
            <>
              <p className="mb-4 text-sm text-muted-foreground">{data.total} {t('resultsCount')}</p>

              {data.results.length === 0 ? (
                <div className="rounded-xl border p-8 text-center">
                  <p className="text-muted-foreground mb-2">{t('noResults')}</p>
                  <p className="text-xs text-muted-foreground mb-4">{t('didYouMean')}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {QUICK_SEARCH_EXAMPLES.map((ex) => (
                      <button
                        key={ex.query}
                        onClick={() => handleQuickSearch(ex.query)}
                        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                      >
                        {ex.label}: {ex.query}
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">{t('tryAgain')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {data.results.map((item) => (
                    <Link
                      key={item.part.id}
                      href={`/parts/${item.part.id}`}
                      className="group rounded-2xl border bg-background overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-foreground/5 hover:-translate-y-0.5"
                    >
                      {/* Image area */}
                      <div className="relative h-44 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
                        <div className="text-4xl opacity-20 group-hover:scale-110 transition-transform duration-300">🔧</div>
                        {/* Condition badge */}
                        {item.part.condition && (
                          <span className={`absolute top-3 right-3 rounded-lg px-2.5 py-1 text-xs font-semibold backdrop-blur-sm ${CONDITION_COLORS[item.part.condition] || 'bg-gray-100 text-gray-800'}`}>
                            {CONDITION_LABELS[item.part.condition] || item.part.condition}
                          </span>
                        )}
                        {/* Store count badge */}
                        <span className="absolute top-3 left-3 rounded-lg bg-background/80 backdrop-blur-sm px-2.5 py-1 text-xs font-medium">
                          {item.storeCount} {t('storeCount')}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-bold text-base group-hover:text-foreground/80 transition-colors">{item.part.nameAr}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{item.part.brand || item.part.nameEn}</p>

                        {/* Part number */}
                        {item.part.partNumber && (
                          <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1 inline-block" dir="ltr">
                            {item.part.partNumber}
                          </p>
                        )}

                        {/* Price + stores */}
                        <div className="mt-3 flex items-end justify-between border-t pt-3">
                          <div>
                            <p className="text-2xl font-bold">{Number(item.minPrice).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">IQD</p>
                          </div>
                          <div className="text-left">
                            <p className="text-xs text-muted-foreground">يتوفر بـ {item.storeCount} متجر</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                    className="rounded-xl border px-5 py-2.5 text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors">
                    {t('previous') || 'السابق'}
                  </button>
                  <div className="flex items-center gap-1 mx-3">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`h-10 w-10 rounded-xl text-sm font-medium transition-all ${
                            page === pageNum
                              ? 'bg-foreground text-background shadow-sm'
                              : 'hover:bg-muted'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                    className="rounded-xl border px-5 py-2.5 text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors">
                    {t('next') || 'التالي'}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
