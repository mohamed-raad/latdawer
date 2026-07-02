'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/use-session'
import { trpc } from '@/lib/trpc/client'

const statusLabels: Record<string, string> = { open: 'مفتوح', offered: 'عروض متاحة', closed: 'مغلق', cancelled: 'ملغي' }
const offerStatusLabels: Record<string, string> = { pending: 'قيد الانتظار', accepted: 'مقبول', rejected: 'مرفوض' }

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, loading: sessionLoading } = useSession()
  const { data: req, isLoading } = trpc.requests.byId.useQuery({ id })
  const { data: offers, refetch: refetchOffers } = trpc.requests.offers.useQuery({ requestId: id })
  const respond = trpc.requests.respondToOffer.useMutation({ onSuccess: () => refetchOffers() })

  if (sessionLoading || isLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">جارٍ التحميل...</p></div>
  if (!user) { router.push('/login'); return null }
  if (!req) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">الطلب غير موجود</p></div>

  const isOwner = req.userId === user.id

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{req.title}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${req.status === 'open' ? 'bg-green-100 text-green-700' : req.status === 'offered' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
          {statusLabels[req.status] || req.status}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p>بواسطة: {req.userName}</p>
        {req.partNumber && <p>رقم القطعة: <span dir="ltr">{req.partNumber}</span></p>}
        {[req.vehicleMake, req.vehicleModel, req.vehicleYear].filter(Boolean).length > 0 && (
          <p>المركبة: {[req.vehicleMake, req.vehicleModel, req.vehicleYear].filter(Boolean).join(' - ')}</p>
        )}
        <p>المدينة: {req.city}</p>
        <p>تاريخ الطلب: {new Date(req.createdAt).toLocaleDateString('ar-IQ')}</p>
        {req.description && <p className="mt-2 rounded-lg bg-muted/50 p-3">{req.description}</p>}
      </div>

      <h2 className="mt-8 text-lg font-bold">العروض ({offers?.length || 0})</h2>
      {offers && offers.length > 0 ? (
        <div className="mt-4 space-y-3">
          {offers.map((offer) => (
            <div key={offer.id} className="rounded-xl border bg-background p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{offer.storeNameAr || offer.storeName}</p>
                  {offer.price && <p className="mt-1 text-lg font-bold">{offer.price.toLocaleString()} د.ع</p>}
                  {offer.notes && <p className="mt-1 text-sm text-muted-foreground">{offer.notes}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${offer.status === 'accepted' ? 'bg-green-100 text-green-700' : offer.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {offerStatusLabels[offer.status] || offer.status}
                  </span>
                </div>
              </div>
              {isOwner && offer.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => respond.mutate({ offerId: offer.id, status: 'accepted' })} className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700">قبول</button>
                  <button onClick={() => respond.mutate({ offerId: offer.id, status: 'rejected' })} className="rounded-lg border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">رفض</button>
                  {offer.storeWhatsapp && <a href={`https://wa.me/${offer.storeWhatsapp}?text=${encodeURIComponent(`السلام عليكم، بخصوص طلب القطعة: ${req.title}`)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700">واتساب</a>}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-muted-foreground">لا توجد عروض بعد. ننتظر المتاجر للرد...</p>
      )}
    </div>
  )
}
