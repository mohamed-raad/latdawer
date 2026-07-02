'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { useSession } from '@/hooks/use-session'

export default function MakeOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { loading: sessionLoading } = useSession()
  const { data: req, isLoading } = trpc.requests.byId.useQuery({ id })
  const utils = trpc.useUtils()

  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const makeOffer = trpc.requests.makeOffer.useMutation({
    onSuccess: () => {
      utils.requests.pendingInCity.invalidate()
      router.push('/dashboard/requests')
    },
    onError: (e) => setError(e.message),
  })

  if (sessionLoading || isLoading) return <div className="flex items-center justify-center p-12"><p className="text-muted-foreground">جارٍ التحميل...</p></div>

  if (!req || req.status !== 'open') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">الطلب غير متاح</h1>
        <p className="mt-2 text-muted-foreground">هذا الطلب مغلق أو غير موجود</p>
        <button onClick={() => router.push('/dashboard/requests')} className="mt-4 rounded-lg border px-4 py-2 text-sm">العودة</button>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    makeOffer.mutate({
      requestId: id,
      price: price ? parseFloat(price) : undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">تقديم عرض</h1>

      <div className="mt-6 rounded-xl border bg-background p-4">
        <h3 className="font-medium">{req.title}</h3>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <p>العميل: {req.userName}</p>
          {req.partNumber && <p>رقم القطعة: <span dir="ltr">{req.partNumber}</span></p>}
          {[req.vehicleMake, req.vehicleModel, req.vehicleYear].filter(Boolean).length > 0 && (
            <p>المركبة: {[req.vehicleMake, req.vehicleModel, req.vehicleYear].filter(Boolean).join(' - ')}</p>
          )}
          <p>المدينة: {req.city}</p>
          {req.description && <p className="mt-2 rounded-lg bg-muted/50 p-3">{req.description}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">السعر (اختياري)</label>
          <div className="mt-1 flex items-center gap-2">
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="مثال: 25000" className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20" />
            <span className="text-sm text-muted-foreground">د.ع</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">ملاحظات</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="مثال: متوفر عندي، أصلية، ضمان شهر..." className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={makeOffer.isPending} className="w-full rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
          {makeOffer.isPending ? 'جارٍ الإرسال...' : 'إرسال العرض'}
        </button>
      </form>
    </div>
  )
}
