'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'
import { CONDITION_LABELS, STATUS_LABELS } from '@/constants'

export function ByVehicleTab({ storeId }: { storeId: string }) {
  const { t } = useLanguage()
  const [selectedMfr, setSelectedMfr] = useState<string | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)

  const { data: specs } = trpc.onboarding.getStoreSpecializations.useQuery()
  const { data: manufacturers } = trpc.onboarding.getManufacturers.useQuery()

  const storeMfrIds = specs?.manufacturers.map((m) => m.manufacturerId) || []
  const storeManufacturers = manufacturers?.filter((m) => storeMfrIds.includes(m.id)) || []

  const selectedMfrObj = storeManufacturers.find((m) => m.id === selectedMfr)
  const { data: mfrVehicles } = trpc.onboarding.getVehiclesByMake.useQuery(
    { make: selectedMfrObj?.name || '' },
    { enabled: !!selectedMfrObj?.name }
  )
  const selectedVehicleIds = specs?.vehicles.map((v) => v.vehicleId) || []
  const availableVehicles = mfrVehicles?.filter((v) => selectedVehicleIds.includes(v.id)) || []

  const { data: inventoryData, isLoading } = trpc.inventory.list.useQuery(
    { storeId, limit: 100 },
    { enabled: !!storeId }
  )

  if (!specs || specs.manufacturers.length === 0) {
    return (
      <div className="rounded-xl border p-8 text-center">
        <p className="text-muted-foreground mb-4">{t('noData')}</p>
        <Link href="/dashboard/onboarding" className="inline-block rounded-lg bg-foreground px-4 py-2 text-sm text-background hover:opacity-90">
          {t('add')} {t('make')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {storeManufacturers.length} {t('make')} / {specs.vehicles.length} {t('model')}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {storeManufacturers.map((mfr) => (
          <button key={mfr.id} onClick={() => { setSelectedMfr(mfr.id); setSelectedVehicle(null) }}
            className={`rounded-xl border-2 p-4 text-center transition-all ${
              selectedMfr === mfr.id ? 'border-foreground shadow-sm' : 'hover:border-foreground/30'
            }`}>
            <p className="font-bold">{mfr.nameAr || mfr.name}</p>
          </button>
        ))}
      </div>

      {selectedMfr && availableVehicles.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-3">
            {selectedMfrObj?.nameAr} - {availableVehicles.length} {t('model')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableVehicles.map((v) => (
              <button key={v.id} onClick={() => setSelectedVehicle(selectedVehicle === v.id ? null : v.id)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  selectedVehicle === v.id ? 'border-foreground shadow-sm' : 'hover:border-foreground/30'
                }`}>
                <p className="font-bold">{v.modelAr || v.model}</p>
                <p className="text-xs text-muted-foreground mt-1">{v.year} - {v.engine}</p>
                {v.trim && <p className="text-xs text-muted-foreground">{v.trim}</p>}
                {v.region && <span className="mt-2 inline-block rounded bg-muted px-2 py-0.5 text-xs">{v.region}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedMfr && availableVehicles.length === 0 && (
        <div className="rounded-xl border p-6 text-center text-muted-foreground mt-4">
          <p>{t('noVehicles')}</p>
        </div>
      )}

      {selectedVehicle && inventoryData && (
        <div className="mt-4">
          <VehicleInventoryItems vehicleId={selectedVehicle} inventory={inventoryData.results} isLoading={isLoading} />
        </div>
      )}
    </div>
  )
}

function VehicleInventoryItems({ vehicleId, inventory, isLoading }: {
  vehicleId: string
  inventory: Array<{
    inventory: { id: string; partId: string; price: number; quantity: number; condition: string; status: string }
    part: { nameAr: string | null; nameEn: string | null; partNumber: string | null }
  }>
  isLoading: boolean
}) {
  const { t } = useLanguage()
  const { data: vehicleParts } = trpc.vehicles.partsByVehicle.useQuery({ vehicleId }, { enabled: !!vehicleId })
  const compatiblePartIds = vehicleParts?.map((vp: { compatibility?: { partId: string }; parts?: { id: string } }) => vp.parts?.id || vp.compatibility?.partId) || []
  const filteredItems = inventory.filter((item) => compatiblePartIds.includes(item.partId))

  if (isLoading) return <div className="h-20 animate-pulse rounded-xl bg-muted" />

  if (filteredItems.length === 0) {
    return (
      <div className="rounded-xl border p-6 text-center text-muted-foreground">
        <p>{t('noInventory')}</p>
        <Link href="/dashboard/inventory/new" className="mt-2 inline-block text-sm text-foreground hover:underline">
          + {t('add')} {t('inventory')}
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-muted-foreground">
            <th className="px-4 py-3 text-right font-medium">{t('name')}</th>
            <th className="px-4 py-3 text-right font-medium">{t('partNumber')}</th>
            <th className="px-4 py-3 text-right font-medium">{t('price')}</th>
            <th className="px-4 py-3 text-right font-medium">{t('quantity')}</th>
            <th className="px-4 py-3 text-right font-medium">{t('condition')}</th>
            <th className="px-4 py-3 text-right font-medium">{t('status')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item) => (
            <tr key={item.inventory.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{item.part.nameAr}</td>
              <td className="px-4 py-3 text-muted-foreground" dir="ltr">{item.part.partNumber}</td>
              <td className="px-4 py-3">{Number(item.inventory.price).toLocaleString()} IQD</td>
              <td className="px-4 py-3">{item.inventory.quantity}</td>
              <td className="px-4 py-3">{CONDITION_LABELS[item.inventory.condition] || item.inventory.condition}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  item.inventory.status === 'active' ? 'bg-green-100 text-green-700' :
                  item.inventory.status === 'out_of_stock' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}>{STATUS_LABELS[item.inventory.status] || item.inventory.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
