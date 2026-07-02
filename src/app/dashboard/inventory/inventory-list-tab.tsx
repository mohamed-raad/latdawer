'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'
import { CONDITION_LABELS, STATUS_LABELS } from '@/constants'

const STOCK_BADGES: Record<string, string> = {
  out: 'bg-red-100 text-red-700',
  low: 'bg-amber-100 text-amber-700',
  in: 'bg-green-100 text-green-700',
}

function stockStatus(qty: number) {
  if (qty === 0) return 'out'
  if (qty <= 10) return 'low'
  return 'in'
}

export function InventoryListTab({ storeId }: { storeId: string }) {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ price: string; quantity: string; status: string }>({ price: '', quantity: '', status: '' })

  const { data, isLoading } = trpc.inventory.list.useQuery(
    { storeId, page, limit: 20, search: search || undefined },
    { enabled: !!storeId }
  )
  const utils = trpc.useUtils()

  const updateMutation = trpc.inventory.update.useMutation({
    onSuccess: () => { utils.inventory.list.invalidate(); setEditingId(null) },
  })

  const deleteMutation = trpc.inventory.delete.useMutation({
    onSuccess: () => utils.inventory.list.invalidate(),
  })

  const totalPages = data ? Math.ceil(data.total / 20) : 0

  function startEdit(item: typeof data extends { results: (infer R)[] } ? R : never) {
    setEditingId(item.inventory.id)
    setEditForm({
      price: String(item.inventory.price),
      quantity: String(item.inventory.quantity),
      status: item.inventory.status,
    })
  }

  function saveEdit(id: string) {
    updateMutation.mutate({
      id,
      price: Number(editForm.price),
      quantity: Number(editForm.quantity),
      status: editForm.status as 'active' | 'inactive' | 'out_of_stock',
    })
  }

  return (
    <>
      <div className="flex gap-2 mb-4">
        <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder={t('searchPlaceholder')} className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : data && data.results.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-muted-foreground">
                  <th className="px-4 py-3 text-right font-medium">{t('name')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('partNumber')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('quantity')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('price')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('condition')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('status')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((item) => {
                  const stock = stockStatus(item.inventory.quantity)
                  const isEditing = editingId === item.inventory.id
                  return (
                    <tr key={item.inventory.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{item.part.nameAr}</td>
                      <td className="px-4 py-3 text-muted-foreground" dir="ltr">{item.part.partNumber}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input type="number" value={editForm.quantity} onChange={(e) => setEditForm((p) => ({ ...p, quantity: e.target.value }))}
                            className="w-20 rounded border px-2 py-1 text-sm ltr text-left" />
                        ) : (
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STOCK_BADGES[stock]}`}>
                            {stock === 'out' ? t('outOfStock') : stock === 'low' ? t('lowStock') : item.inventory.quantity}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input type="number" value={editForm.price} onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                            className="w-28 rounded border px-2 py-1 text-sm ltr text-left" />
                        ) : (
                          <span>{Number(item.inventory.price).toLocaleString()} IQD</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{CONDITION_LABELS[item.inventory.condition] || item.inventory.condition}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                            className="rounded border px-2 py-1 text-sm bg-background">
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            item.inventory.status === 'active' ? 'bg-green-100 text-green-700' :
                            item.inventory.status === 'out_of_stock' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                          }`}>{STATUS_LABELS[item.inventory.status] || item.inventory.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button onClick={() => saveEdit(item.inventory.id)} disabled={updateMutation.isPending}
                                className="text-sm text-green-600 hover:underline">{t('save')}</button>
                              <button onClick={() => setEditingId(null)} className="text-sm text-muted-foreground hover:underline">{t('cancel')}</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(item)} className="text-sm text-foreground hover:underline">{t('edit')}</button>
                              <Link href={`/dashboard/inventory/${item.inventory.id}/edit`} className="text-sm text-muted-foreground hover:underline">{t('update')}</Link>
                              <button onClick={() => { if (confirm(t('confirm') + '?')) deleteMutation.mutate({ id: item.inventory.id }) }}
                                className="text-sm text-red-500 hover:underline">{t('delete')}</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">{t('previous')}</button>
              <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">{t('next')}</button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border p-12 text-center">
          <p className="text-muted-foreground">{t('noResults')}</p>
          <button onClick={() => {}} className="mt-4 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background">+ {t('add')}</button>
        </div>
      )}
    </>
  )
}
