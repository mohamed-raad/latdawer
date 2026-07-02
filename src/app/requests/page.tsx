'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/use-session'
import { trpc } from '@/lib/trpc/client'

const statusLabels: Record<string, string> = { open: 'مفتوح', offered: 'عروض متاحة', closed: 'مغلق', cancelled: 'ملغي' }
const statusColors: Record<string, string> = { open: 'bg-green-100 text-green-700', offered: 'bg-blue-100 text-blue-700', closed: 'bg-gray-100 text-gray-500', cancelled: 'bg-red-100 text-red-700' }

export default function MyRequestsPage() {
  const router = useRouter()
  const { user, loading: sessionLoading } = useSession()
  const { data, isLoading } = trpc.requests.list.useQuery()

  if (sessionLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">جارٍ التحميل...</p></div>
  if (!user) { router.push('/login'); return null }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">طلباتي</h1>
        <Link href="/requests/new" className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background">طلب قطعة جديدة</Link>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : data && data.results.length > 0 ? (
        <div className="mt-6 space-y-3">
          {data.results.map((r) => (
            <Link key={r.id} href={`/requests/${r.id}`} className="block rounded-xl border bg-background p-4 transition-colors hover:bg-muted/50">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">{r.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[r.vehicleMake, r.vehicleModel, r.vehicleYear].filter(Boolean).join(' - ')}
                    {r.partNumber && <> | <span dir="ltr">{r.partNumber}</span></>}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusColors[r.status] || ''}`}>
                  {statusLabels[r.status] || r.status}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{r.city}</span>
                <span>{r.offerCount} عروض</span>
                <span>{new Date(r.createdAt).toLocaleDateString('ar-IQ')}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">لا توجد طلبات بعد</p>
          <Link href="/requests/new" className="mt-4 inline-block rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background">أول طلب</Link>
        </div>
      )}
    </div>
  )
}
