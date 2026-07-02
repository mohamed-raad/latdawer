'use client'

import { trpc } from '@/lib/trpc/client'
import { useSession } from '@/hooks/use-session'

export default function AdminDashboard() {
  const { user } = useSession()
  const { data, isLoading } = trpc.admin.stats.useQuery()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">لوحة التحكم</h1>
      <p className="text-sm text-muted-foreground mb-6">
        مرحباً، {user?.name ?? 'المدير'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border p-6 space-y-3">
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
            ))
          : [
              { label: 'المستخدمين', value: data?.users ?? 0 },
              { label: 'المتاجر', value: data?.stores ?? 0 },
              { label: 'القطع', value: data?.parts ?? 0 },
              { label: 'القطع في المخزون', value: data?.inventory ?? 0 },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border p-6">
                <p className="text-3xl font-bold">
                  {stat.value.toLocaleString('ar-EG')}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
      </div>
    </div>
  )
}
