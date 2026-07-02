'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'

const conditionLabels: Record<string, string> = { new: 'جديد', used: 'مستعمل', refurbished: 'مُجدد', salvage: 'تشليح' }
const conditionColors: Record<string, string> = {
  new: 'bg-green-100 text-green-800', used: 'bg-yellow-100 text-yellow-800',
  refurbished: 'bg-blue-100 text-blue-800', salvage: 'bg-red-100 text-red-800',
}
const verifiedBadge: Record<string, string> = { verified: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', rejected: 'bg-red-100 text-red-700' }
const verifiedLabel: Record<string, string> = { verified: 'موثق', pending: 'قيد الانتظار', rejected: 'مرفوض' }

function CompareFallback() {
  return <div className="mx-auto max-w-4xl p-6"><p className="text-muted-foreground">جارٍ التحميل...</p></div>
}

export default function ComparePage() {
  return <Suspense fallback={<CompareFallback />}><CompareContent /></Suspense>
}

function CompareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const partId = searchParams.get('partId') || ''
  const { data: part } = trpc.parts.byId.useQuery({ id: partId }, { enabled: !!partId })
  const { data: entries, isLoading } = trpc.inventory.compare.useQuery({ partId }, { enabled: !!partId })

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <input
          type="text"
          placeholder="أدخل رقم القطعة أو رابطها..."
          defaultValue={partId}
          onKeyDown={(e) => { if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value.trim(); if (v) router.push(`/compare?partId=${v}`) } }}
          className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      {part && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">مقارنة الأسعار</h1>
          <Link href={`/parts/${part.id}`} className="text-sm text-blue-600 hover:underline">
            {part.nameAr} ({part.partNumber})
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : entries && entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((e, i) => (
            <div key={e.id} className="relative rounded-xl border bg-background p-4 transition-shadow hover:shadow-md">
              {i === 0 && <span className="absolute -top-2 -left-2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">الأرخص</span>}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/stores/${e.store.id}`} className="font-medium hover:underline">{e.store.nameAr || e.store.name}</Link>
                  <p className="text-xs text-muted-foreground">{e.store.city}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${conditionColors[e.condition] || ''}`}>
                      {conditionLabels[e.condition] || e.condition}
                    </span>
                    {e.store.verified && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${verifiedBadge[e.store.verified] || ''}`}>
                        {verifiedLabel[e.store.verified] || e.store.verified}
                      </span>
                    )}
                  </div>
                  {e.installationPrice && (
                    <p className="mt-1 text-xs text-muted-foreground">التركيب: +{e.installationPrice.toLocaleString()} د.ع</p>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold">{e.price.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">د.ع</span></p>
                  <p className="text-xs text-muted-foreground">الكمية: {e.quantity}</p>
                  <div className="mt-2 flex gap-1">
                    {e.store.whatsapp && (
                      <a href={`https://wa.me/${e.store.whatsapp}?text=${encodeURIComponent(`السلام عليكم، أود شراء ${part?.nameAr || 'القطعة'} بسعر ${e.price} د.ع`)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700">واتساب</a>
                    )}
                    {e.store.phone && (
                      <a href={`tel:${e.store.phone}`} className="rounded-lg border px-3 py-1 text-xs font-medium hover:bg-muted">اتصال</a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : partId ? (
        <div className="rounded-xl border p-8 text-center text-muted-foreground">
          {part ? 'لا توجد متاجر تبيع هذه القطعة حالياً' : 'القطعة غير موجودة. تأكد من الرقم.'}
        </div>
      ) : (
        <div className="rounded-xl border p-12 text-center text-muted-foreground">
          أدخل رقم القطعة لمقارنة الأسعار بين المتاجر
        </div>
      )}
    </div>
  )
}
