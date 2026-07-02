'use client'

import { useParams } from 'next/navigation'
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

export default function DisputeDetailPage() {
  const params = useParams()
  const disputeId = params.id as string
  const { t, locale } = useLanguage()

  const { data: result, isLoading } = trpc.disputes.get.useQuery({ id: disputeId })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-center text-muted-foreground">{t('loading')}</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <p className="text-lg mb-4">{t('notFound_')}</p>
        <Link href="/dashboard/disputes" className="text-sm text-muted-foreground hover:text-foreground">
          {t('back')}
        </Link>
      </div>
    )
  }

  const { dispute, store } = result

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/dashboard/disputes" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
        {t('back')}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{t('disputes')}</h1>
        <span className={`text-xs px-3 py-1 rounded-full ${STATUS_COLORS[dispute.status] || 'bg-gray-100'}`}>
          {STATUS_LABELS[dispute.status]?.[locale === 'ar' ? 'ar' : 'en'] || dispute.status}
        </span>
      </div>

      <div className="rounded-xl border p-6 mb-6">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('transactionStore')}</span>
            <span className="font-medium">{store.nameAr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('disputeReason')}</span>
            <span>{dispute.reason}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('transactionDate')}</span>
            <span>{new Date(dispute.createdAt).toLocaleDateString('ar-IQ')}</span>
          </div>
          {store.phone && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('phone')}</span>
              <span dir="ltr">{store.phone}</span>
            </div>
          )}
        </div>
      </div>

      {dispute.description && (
        <div className="rounded-xl border p-6 mb-6">
          <h2 className="font-bold mb-2">{t('disputeDetails')}</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{dispute.description}</p>
        </div>
      )}

      {dispute.resolution && (
        <div className="rounded-xl border p-6 bg-green-50/50">
          <h2 className="font-bold mb-2">{t('resolveDispute')}</h2>
          <p className="text-sm">{dispute.resolution}</p>
          {dispute.resolvedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(dispute.resolvedAt).toLocaleDateString('ar-IQ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
