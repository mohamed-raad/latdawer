'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'

const STATUS_FILTERS = [
  { id: 'all', labelAr: 'الكل', labelEn: 'All' },
  { id: 'completed', labelAr: 'مكتمل', labelEn: 'Completed' },
  { id: 'pending', labelAr: 'بانتظار', labelEn: 'Pending' },
  { id: 'refunded', labelAr: 'مسترجع', labelEn: 'Refunded' },
]

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  refunded: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
}

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  completed: { ar: 'مكتمل', en: 'Completed' },
  pending: { ar: 'بانتظار الدفع', en: 'Pending Payment' },
  refunded: { ar: 'مسترجع', en: 'Refunded' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
}

export default function TransactionsPage() {
  const { t, locale } = useLanguage()
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: stats } = trpc.transactions.stats.useQuery()
  const { data: transactionsData, isLoading } = trpc.transactions.list.useQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
  })

  const transactions = transactionsData as Array<{
    transaction: { id: string; totalAmount: number; status: string; notes: string | null; createdAt: Date }
    store: { id: string; nameAr: string | null; name: string; phone: string | null }
  }> | undefined

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{t('transactions')}</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">{t('transactions')}</p>
            <p className="text-2xl font-bold">{stats.totalTransactions}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">{t('totalSpent')}</p>
            <p className="text-2xl font-bold">{Number(stats.totalSpent).toLocaleString()} د.ع</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setStatusFilter(filter.id)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              statusFilter === filter.id
                ? 'bg-foreground text-background'
                : 'border hover:bg-muted'
            }`}
          >
            {locale === 'ar' ? filter.labelAr : filter.labelEn}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">{t('loading')}</p>
      ) : transactions && transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((item) => (
            <Link
              key={item.transaction.id}
              href={`/dashboard/transactions/${item.transaction.id}`}
              className="block rounded-xl border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">{item.store.nameAr}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.transaction.createdAt).toLocaleDateString('ar-IQ')}
                  </p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">{Number(item.transaction.totalAmount).toLocaleString()} د.ع</p>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded ${STATUS_COLORS[item.transaction.status] || 'bg-gray-100'}`}>
                    {STATUS_LABELS[item.transaction.status]?.[locale === 'ar' ? 'ar' : 'en'] || item.transaction.status}
                  </span>
                </div>
              </div>
              {item.transaction.notes && (
                <p className="text-xs text-muted-foreground truncate">{item.transaction.notes}</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">{t('noTransactions')}</p>
        </div>
      )}
    </div>
  )
}
