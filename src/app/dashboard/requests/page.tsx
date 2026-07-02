'use client'

import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { useSession } from '@/hooks/use-session'

export default function DashboardRequestsPage() {
  const { user, loading: sessionLoading } = useSession()
  const { data: store } = trpc.stores.myStore.useQuery(undefined, { enabled: !!user })
  const city = store?.city
  const { data, isLoading } = trpc.requests.pendingInCity.useQuery(
    { city: city || '', page: 1, limit: 50 },
    { enabled: !!city }
  )

  if (sessionLoading) return <div className="flex items-center justify-center p-12"><p className="text-muted-foreground">جارٍ التحميل...</p></div>

  if (!city) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">طلبات القطع</h1>
        <p className="mt-4 text-muted-foreground">ليس لديك متجر حتى الآن. قم بإضافة متجر أولاً لاستقبال طلبات القطع.</p>
        <Link href="/dashboard/stores" className="mt-4 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background">إدارة المتجر</Link>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">طلبات القطع</h1>
      <p className="mt-1 text-muted-foreground">طلبات مفتوحة من العملاء في مدينة {city}</p>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : data && data.results.length > 0 ? (
        <div className="mt-6 space-y-3">
          {data.results.map((r) => (
            <Link key={r.id} href={`/dashboard/requests/${r.id}`} className="block rounded-xl border bg-background p-4 transition-colors hover:bg-muted/50">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">{r.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.userName}
                    {r.partNumber && <> | <span dir="ltr">{r.partNumber}</span></>}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">مفتوح</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                {[r.vehicleMake, r.vehicleModel, r.vehicleYear].filter(Boolean).join(' - ') && (
                  <span>{[r.vehicleMake, r.vehicleModel, r.vehicleYear].filter(Boolean).join(' - ')}</span>
                )}
                <span>{new Date(r.createdAt).toLocaleDateString('ar-IQ')}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">لا توجد طلبات مفتوحة في {city} حالياً</p>
        </div>
      )}
    </div>
  )
}
