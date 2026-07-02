'use client'

import { useState, useRef, useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'

interface PartSelectorProps {
  value: string
  onChange: (partId: string, partName: string, partNumber: string | null) => void
}

export function PartSelector({ value, onChange }: PartSelectorProps) {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const { data, isLoading } = trpc.search.parts.useQuery(
    { q: debounced, limit: 10 },
    { enabled: debounced.length >= 2 }
  ) as { data: { results: Array<{ part: { id: string; nameAr: string; nameEn: string | null; partNumber: string | null; brand: string | null } }> } | undefined; isLoading: boolean }

  const selected = value ? `selected-${value}` : ''

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs text-muted-foreground mb-1">{t('selectPart') || 'اختيار القطعة'}</label>
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setShow(true) }}
        onFocus={() => setShow(true)}
        placeholder={t('searchPlaceholder')}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
      />
      {show && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-lg border bg-background shadow-lg">
          {isLoading ? (
            <div className="p-3 text-sm text-muted-foreground">{t('loading')}</div>
          ) : !data || data.results.length === 0 ? (
            debounced.length >= 2 ? (
              <div className="p-3 text-sm text-muted-foreground">{t('noResults')}</div>
            ) : (
              <div className="p-3 text-sm text-muted-foreground">{t('typeToSearch') || 'اكتب للبحث...'}</div>
            )
          ) : (
            data.results.map((item) => (
              <button
                key={item.part.id}
                type="button"
                onClick={() => {
                  onChange(item.part.id, item.part.nameAr, item.part.partNumber)
                  setQuery(`${item.part.nameAr} (${item.part.partNumber})`)
                  setShow(false)
                }}
                className={`w-full px-4 py-3 text-right text-sm hover:bg-muted transition-colors border-b last:border-0 ${
                  value === item.part.id ? 'bg-muted' : ''
                }`}
              >
                <p className="font-medium">{item.part.nameAr}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">{item.part.partNumber} {item.part.brand ? `• ${item.part.brand}` : ''}</p>
              </button>
            ))
          )}
        </div>
      )}
      {selected && value && (
        <p className="mt-1 text-xs text-green-600">{t('partSelected') || 'تم اختيار القطعة'}</p>
      )}
    </div>
  )
}
