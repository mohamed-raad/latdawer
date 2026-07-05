'use client'

import Link from 'next/link'
import { useSession } from '@/hooks/use-session'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'

function ar(n: number) {
  return n.toLocaleString('ar-IQ')
}

const QUICK_ACTIONS = [
  { href: '/search', icon: '🔍', labelAr: 'بحث عن قطعة', color: 'from-blue-500 to-blue-600' },
  { href: '/scan', icon: '📷', labelAr: 'مسح باركود', color: 'from-purple-500 to-purple-600' },
  { href: '/compare', icon: '⚖️', labelAr: 'مقارنة أسعار', color: 'from-amber-500 to-amber-600' },
  { href: '/requests/new', icon: '📝', labelAr: 'طلب قطعة', color: 'from-green-500 to-green-600' },
]

export default function DashboardPage() {
  const { user, loading: sessionLoading } = useSession()
  const { t } = useLanguage()
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, {
    retry: false,
    enabled: user?.role === 'Admin' || user?.role === 'SuperAdmin',
  })
  const { data: store } = trpc.stores.myStore.useQuery(undefined, {
    enabled: user?.role === 'StoreManager',
  })
  const { data: myRequests } = trpc.requests.list.useQuery(undefined, {
    enabled: user?.role === 'Customer',
  })

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
      </div>
    )
  }

  const isStoreManager = user?.role === 'StoreManager'
  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {t('hello')}{user?.name ? `، ${user.name}` : ''}
        </h1>
        <p className="mt-1 text-muted-foreground">{t('dashboard')}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.href} href={action.href}
            className="group flex items-center gap-3 rounded-2xl border p-4 hover:shadow-lg hover:border-foreground/20 transition-all duration-200">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} text-2xl shadow-sm group-hover:scale-110 transition-transform`}>
              {action.icon}
            </div>
            <span className="text-sm font-medium">{action.labelAr}</span>
          </Link>
        ))}
      </div>

      {/* Admin Stats */}
      {isAdmin && stats && !statsLoading && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">إحصائيات النظام</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t('totalUsers')}
              value={ar(stats.users)}
              icon="👥"
              color="from-blue-500 to-blue-600"
              trend="+12%"
            />
            <StatCard
              title={t('totalStores')}
              value={ar(stats.stores)}
              icon="🏪"
              color="from-green-500 to-green-600"
              trend="+8%"
            />
            <StatCard
              title={t('totalParts')}
              value={ar(stats.parts)}
              icon="🔧"
              color="from-purple-500 to-purple-600"
              trend="+24%"
            />
            <StatCard
              title={t('totalInventory')}
              value={ar(stats.inventory)}
              icon="📦"
              color="from-amber-500 to-amber-600"
              trend="+15%"
            />
          </div>
        </div>
      )}

      {/* Store Manager Section */}
      {isStoreManager && store && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">متجري</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/dashboard/inventory" className="group block">
              <div className="rounded-2xl border p-6 hover:shadow-lg hover:border-foreground/20 transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-2xl shadow-sm">
                    📦
                  </div>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">نشط</span>
                </div>
                <h3 className="text-xl font-bold">{t('inventory')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t('storeManagement')}</p>
              </div>
            </Link>

            <Link href="/dashboard/requests" className="group block">
              <div className="rounded-2xl border p-6 hover:shadow-lg hover:border-foreground/20 transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-2xl shadow-sm">
                    📋
                  </div>
                </div>
                <h3 className="text-xl font-bold">{t('pendingRequests')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{store.city ? `في ${store.city}` : ''}</p>
              </div>
            </Link>

            <Link href="/dashboard/stores" className="group block">
              <div className="rounded-2xl border p-6 hover:shadow-lg hover:border-foreground/20 transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-2xl shadow-sm">
                    🏪
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${store.verified === 'verified' ? 'text-green-600 bg-green-100' : 'text-amber-600 bg-amber-100'}`}>
                    {store.verified === 'verified' ? t('verified') : t('pending')}
                  </span>
                </div>
                <h3 className="text-xl font-bold">{store.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{store.city}</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Customer Section */}
      {user?.role === 'Customer' && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">حسابي</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/garage" className="group block">
              <div className="rounded-2xl border p-6 hover:shadow-lg hover:border-foreground/20 transition-all duration-200">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-2xl shadow-sm mb-4">
                  🚗
                </div>
                <h3 className="text-xl font-bold">{t('myGarage')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{myRequests ? String(myRequests.total) : '0'} سيارة</p>
              </div>
            </Link>

            <Link href="/requests" className="group block">
              <div className="rounded-2xl border p-6 hover:shadow-lg hover:border-foreground/20 transition-all duration-200">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-2xl shadow-sm mb-4">
                  📋
                </div>
                <h3 className="text-xl font-bold">{t('myRequests')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{myRequests ? String(myRequests.total) : '0'} طلب</p>
              </div>
            </Link>

            <Link href="/search" className="group block">
              <div className="rounded-2xl border p-6 hover:shadow-lg hover:border-foreground/20 transition-all duration-200">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-2xl shadow-sm mb-4">
                  🔍
                </div>
                <h3 className="text-xl font-bold">{t('search_')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t('searchPlaceholder')}</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Recent Activity - only show if there's actual data */}
      {!isAdmin && myRequests && myRequests.total > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">آخر الطلبات</h2>
          <div className="rounded-2xl border divide-y">
            {myRequests.results?.slice(0, 5).map((req: { id: string; title: string; status: string; createdAt: Date }) => (
              <Link key={req.id} href={`/requests/${req.id}`}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-lg">📋</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{req.title}</p>
                  <p className="text-xs text-muted-foreground">{req.status === 'open' ? 'مفتوح' : req.status === 'closed' ? 'مغلق' : req.status}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon, color, trend }: {
  title: string
  value: string
  icon: string
  color: string
  trend?: string
}) {
  return (
    <div className="rounded-2xl border p-5 hover:shadow-lg hover:border-foreground/20 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-2xl shadow-sm`}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{title}</p>
    </div>
  )
}
