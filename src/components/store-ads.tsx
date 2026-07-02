'use client'

import { useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'

interface StoreAdsProps {
  query?: string
  category?: string
}

export function StoreAds({ query, category }: StoreAdsProps) {
  const { data: ads } = trpc.features.listActiveAds.useQuery({
    targetQuery: query,
    targetCategory: category,
  })

  const recordImpressionMutation = trpc.features.recordAdImpression.useMutation()
  const recordClickMutation = trpc.features.recordAdClick.useMutation()

  useEffect(() => {
    if (ads) {
      ads.forEach(ad => {
        recordImpressionMutation.mutate({ adId: ad.id })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ads])

  if (!ads || ads.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">إعلان</span>
        <span className="text-xs text-muted-foreground">إعلانات المتاجر</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ads.map((ad) => (
          <button
            key={ad.id}
            onClick={() => {
              recordClickMutation.mutate({ adId: ad.id })
              if (ad.targetQuery) {
                window.location.href = `/search?q=${encodeURIComponent(ad.targetQuery)}`
              }
            }}
            className="text-right rounded-xl border p-4 hover:shadow-md transition-shadow bg-gradient-to-l from-amber-50 to-background"
          >
            {ad.imageUrl && (
              <img
                src={ad.imageUrl}
                alt={ad.titleAr}
                className="mb-2 h-24 w-full rounded-lg object-cover"
              />
            )}
            <h3 className="font-bold text-sm">{ad.titleAr}</h3>
            {ad.descriptionAr && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ad.descriptionAr}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}