'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'
import { STORE_STATUS_LABELS, STORE_STATUS_COLORS } from '@/constants'

export default function StoresPage() {
  const { t } = useLanguage()
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingStoreId, setRejectingStoreId] = useState<string | null>(null)
  
  const { data, isLoading, refetch } = trpc.stores.list.useQuery()
  const verifyStore = trpc.admin.verifyStore.useMutation({
    onSuccess: () => refetch(),
  })
  const rejectStore = trpc.admin.rejectStore.useMutation({
    onSuccess: () => {
      refetch()
      setRejectingStoreId(null)
      setRejectReason('')
    },
  })

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">{t('stores')}</h1>
        <div className="rounded-xl border p-12 text-center text-muted-foreground">
          {t('loading')}
        </div>
      </div>
    )
  }

  const stores = data?.results ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('stores')}</h1>
      {stores.length === 0 ? (
        <div className="rounded-xl border p-12 text-center text-muted-foreground">
          {t('noStores')}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-right p-3 font-medium">{t('storeNameAr')}</th>
                <th className="text-right p-3 font-medium">{t('owner')}</th>
                <th className="text-right p-3 font-medium">{t('city')}</th>
                <th className="text-right p-3 font-medium">{t('status')}</th>
                <th className="text-right p-3 font-medium">{t('registrationDate')}</th>
                <th className="text-right p-3 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id} className="border-t">
                  <td className="p-3">{store.nameAr || store.name}</td>
                  <td className="p-3 text-muted-foreground">
                    {store.ownerId ? `${store.ownerId.slice(0, 12)}...` : '—'}
                  </td>
                  <td className="p-3 text-muted-foreground">{store.city || '—'}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STORE_STATUS_COLORS[store.verified] ?? ''}`}
                    >
                      {STORE_STATUS_LABELS[store.verified] ?? store.verified}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(store.createdAt).toLocaleDateString('ar-IQ')}
                  </td>
                  <td className="p-3">
                    {store.verified === 'pending' && (
                      <>
                        <button
                          onClick={() => verifyStore.mutate({ storeId: store.id })}
                          disabled={verifyStore.isPending}
                          className="rounded-lg bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {verifyStore.isPending ? '...' : t('verify')}
                        </button>
                        <button
                          onClick={() => setRejectingStoreId(store.id)}
                          className="ml-2 rounded-lg bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                        >
                          {t('reject')}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Reject Modal */}
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
                onClick={() => rejectStore.mutate({ storeId: rejectingStoreId, reason: rejectReason })}
                disabled={!rejectReason || rejectStore.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {rejectStore.isPending ? '...' : t('confirmReject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}