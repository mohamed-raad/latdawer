'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/use-session'
import { trpc } from '@/lib/trpc/client'

export default function GaragePage() {
  const router = useRouter()
  const { user, loading: sessionLoading } = useSession()
  const { data: vehicles, isLoading } = trpc.garage.list.useQuery()
  const remove = trpc.garage.remove.useMutation({ onSuccess: () => utils.garage.list.invalidate() })
  const utils = trpc.useUtils()

  if (sessionLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">جارٍ التحميل...</p></div>
  if (!user) { router.push('/login'); return null }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مرآبي</h1>
        <Link href="/garage/add" className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background">إضافة مركبة</Link>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : vehicles && vehicles.length > 0 ? (
        <div className="mt-6 space-y-3">
          {vehicles.map((v) => (
            <div key={v.id} className="rounded-xl border bg-background p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{v.makeAr} {v.modelAr}</h3>
                  <p className="text-sm text-muted-foreground">{v.year} {v.engine ? `- ${v.engine}` : ''}</p>
                  {v.nickname && <p className="mt-1 text-xs text-muted-foreground">لقب: {v.nickname}</p>}
                  {v.licensePlate && <p className="text-xs text-muted-foreground">لوحة: {v.licensePlate}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/parts/by-vehicle/${v.vehicleId}`} className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background">القطع المناسبة</Link>
                  <button onClick={() => remove.mutate({ vehicleId: v.vehicleId })} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">حذف</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">لم تضف أي مركبة بعد</p>
          <Link href="/garage/add" className="mt-4 inline-block rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background">إضافة أول مركبة</Link>
        </div>
      )}
    </div>
  )
}
