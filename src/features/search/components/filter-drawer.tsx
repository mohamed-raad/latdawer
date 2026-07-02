'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n'
import { CONDITION_LABELS, IRAQI_CITIES } from '@/constants'
import { trpc } from '@/lib/trpc/client'

interface FilterDrawerProps {
  categoryId: string
  setCategoryId: (value: string) => void
  manufacturerId: string
  setManufacturerId: (value: string) => void
  condition: string
  setCondition: (value: string) => void
  minPrice: string
  setMinPrice: (value: string) => void
  maxPrice: string
  setMaxPrice: (value: string) => void
  city: string
  setCity: (value: string) => void
  inStockOnly: boolean
  setInStockOnly: (value: boolean) => void
  setPage: (value: number) => void
}

export function FilterDrawer({
  categoryId,
  setCategoryId,
  manufacturerId,
  setManufacturerId,
  condition,
  setCondition,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  city,
  setCity,
  inStockOnly,
  setInStockOnly,
  setPage,
}: FilterDrawerProps) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const { data: categoryData } = trpc.search.categories.useQuery()
  const { data: manufacturerData } = trpc.search.manufacturers.useQuery()

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-4 left-4 right-4 z-40 rounded-xl bg-foreground px-4 py-3 text-background font-medium shadow-lg"
      >
        {t('filter')}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-80 bg-background shadow-xl overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">{t('filter')}</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{t('category')}</label>
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value)
                      setPage(1)
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  >
                    <option value="">{t('all')}</option>
                    {categoryData?.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{t('manufacturer_')}</label>
                  <select
                    value={manufacturerId}
                    onChange={(e) => {
                      setManufacturerId(e.target.value)
                      setPage(1)
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  >
                    <option value="">{t('all')}</option>
                    {manufacturerData?.map((m) => (
                      <option key={m.id} value={m.id}>{m.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{t('condition')}</label>
                  <select
                    value={condition}
                    onChange={(e) => {
                      setCondition(e.target.value)
                      setPage(1)
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  >
                    <option value="">{t('all')}</option>
                    {Object.entries(CONDITION_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{t('priceRange')} (IQD)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={t('fromPrice')}
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(e.target.value)
                        setPage(1)
                      }}
                      className="w-full rounded-lg border px-2 py-2 text-sm outline-none"
                    />
                    <input
                      type="number"
                      placeholder={t('toPrice')}
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(e.target.value)
                        setPage(1)
                      }}
                      className="w-full rounded-lg border px-2 py-2 text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{t('city')}</label>
                  <select
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value)
                      setPage(1)
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  >
                    <option value="">{t('all')}</option>
                    {IRAQI_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => {
                      setInStockOnly(e.target.checked)
                      setPage(1)
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-xs font-medium">{t('inStockOnly')}</span>
                </label>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-full mt-6 rounded-lg bg-foreground px-4 py-2 text-background font-medium"
              >
                {t('apply')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}