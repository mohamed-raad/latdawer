'use client'

import { useState } from 'react'
import { useGeolocation, calculateDistance } from '@/hooks/use-geolocation'

interface Store {
  id: string
  name: string
  nameAr: string | null
  city: string | null
  gpsLat: string | null
  gpsLng: string | null
  phone: string | null
}

interface StoreMapProps {
  stores: Store[]
  onStoreSelect?: (storeId: string) => void
}

export function StoreMap({ stores, onStoreSelect }: StoreMapProps) {
  const { latitude, longitude } = useGeolocation()
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [sortBy, setSortBy] = useState<'distance' | 'name'>('distance')

  const storesWithDistance = stores
    .filter(s => s.gpsLat && s.gpsLng)
    .map(store => ({
      ...store,
      distance: latitude && longitude
        ? calculateDistance(latitude, longitude, parseFloat(store.gpsLat!), parseFloat(store.gpsLng!))
        : Infinity,
    }))
    .sort((a, b) => sortBy === 'distance' ? a.distance - b.distance : (a.nameAr || a.name).localeCompare(b.nameAr || b.name))

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm">المتاجر القريبة</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'distance' | 'name')}
          className="rounded-lg border px-2 py-1 text-xs"
        >
          <option value="distance">الأقرب</option>
          <option value="name">الاسم</option>
        </select>
      </div>

      {!latitude && (
        <p className="text-xs text-muted-foreground mb-3">فعّل الموقع لرؤية المتاجر القريبة</p>
      )}

      <div className="space-y-2 max-h-64 overflow-auto">
        {storesWithDistance.map(store => (
          <button
            key={store.id}
            onClick={() => {
              setSelectedStore(store)
              onStoreSelect?.(store.id)
            }}
            className={`w-full text-right rounded-lg border p-3 transition-colors ${
              selectedStore?.id === store.id ? 'border-foreground bg-muted' : 'hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{store.nameAr || store.name}</p>
                {store.city && <p className="text-xs text-muted-foreground">{store.city}</p>}
              </div>
              {store.distance !== Infinity && (
                <span className="text-xs text-muted-foreground">
                  {store.distance < 1 ? `${Math.round(store.distance * 1000)} م` : `${store.distance.toFixed(1)} كم`}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedStore && (
        <div className="mt-4 rounded-lg bg-muted p-3">
          <p className="font-medium text-sm">{selectedStore.nameAr || selectedStore.name}</p>
          {selectedStore.phone && (
            <a
              href={`tel:${selectedStore.phone}`}
              className="text-xs text-blue-600 hover:underline block mt-1"
              dir="ltr"
            >
              📞 {selectedStore.phone}
            </a>
          )}
        </div>
      )}
    </div>
  )
}