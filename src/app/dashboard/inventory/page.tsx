'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { useSession } from '@/hooks/use-session'
import { useLanguage } from '@/lib/i18n'
import { InventoryListTab } from './inventory-list-tab'
import { ByVehicleTab } from './by-vehicle-tab'
import { AddItemFlow } from './add-item-flow'

export default function InventoryPage() {
  const { user, loading: sessionLoading } = useSession()
  const { t } = useLanguage()
  const [tab, setTab] = useState<'list' | 'byVehicle' | 'addItem'>('list')

  const { data: store } = trpc.stores.myStore.useQuery(undefined, { enabled: !!user })
  const storeId = store?.id || ''

  if (sessionLoading) return <div className="flex items-center justify-center p-12"><p className="text-muted-foreground">{t('loading')}</p></div>
  if (!store) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">{t('inventory')}</h1>
        <p className="mt-4 text-muted-foreground">{t('noStore')}</p>
        <Link href="/dashboard/stores" className="mt-4 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background">{t('createStore')}</Link>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t('inventory')}</h1>
        <button onClick={() => setTab('addItem')} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background">
          + {t('add')} {t('inventory')}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('list')} className={`rounded-lg px-4 py-2 text-sm ${tab === 'list' ? 'bg-foreground text-background' : 'border hover:bg-muted'}`}>
          {t('inventory')}
        </button>
        <button onClick={() => setTab('byVehicle')} className={`rounded-lg px-4 py-2 text-sm ${tab === 'byVehicle' ? 'bg-foreground text-background' : 'border hover:bg-muted'}`}>
          {t('make')} / {t('model')}
        </button>
      </div>

      {tab === 'addItem' && <AddItemFlow storeId={storeId} onDone={() => setTab('list')} onCancel={() => setTab('list')} />}
      {tab === 'byVehicle' && <ByVehicleTab storeId={storeId} />}
      {tab === 'list' && <InventoryListTab storeId={storeId} />}
    </div>
  )
}
