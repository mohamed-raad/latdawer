'use client'

import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-700',
  'under-review': 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
}

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  open: { ar: 'مفتوح', en: 'Open' },
  'under-review': { ar: 'قيد المراجعة', en: 'Under Review' },
  resolved: { ar: 'تم الحل', en: 'Resolved' },
  closed: { ar: 'مغلق', en: 'Closed' },
}

export default function DisputesPage() {
  const { t, locale } = useLanguage()
  const { data: disputes, isLoading } = trpc.disputes.list.useQuery()

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('disputes')}</h1>
        <Link
          href="/dashboard/disputes/new"
          className="rounded-lg bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
        >
          {t('openDispute')}
        </Link>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">{t('loading')}</p>
      ) : disputes && disputes.length > 0 ? (
        <div className="space-y-3">
          {disputes.map((item) => (
            <Link
              key={item.dispute.id}
              href={`/dashboard/disputes/${item.dispute.id}`}
              className="block rounded-xl border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">{item.store.nameAr}</p>
                  <p className="text-xs text-muted-foreground">{item.dispute.reason}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[item.dispute.status] || 'bg-gray-100'}`}>
                  {STATUS_LABELS[item.dispute.status]?.[locale === 'ar' ? 'ar' : 'en'] || item.dispute.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(item.dispute.createdAt).toLocaleDateString('ar-IQ')}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">{t('noDisputes')}</p>
          <Link href="/dashboard/transactions" className="text-sm hover:text-foreground">
            {t('transactions')}
          </Link>
        </div>
      )}
    </div>
  )
}
