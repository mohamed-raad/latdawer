'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'

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

export default function TransactionDetailPage() {
  const params = useParams()
  const transactionId = params.id as string
  const { t, locale } = useLanguage()

  const { data: result, isLoading } = trpc.transactions.get.useQuery({ id: transactionId })

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
        <Link href="/dashboard/transactions" className="text-sm text-muted-foreground hover:text-foreground">
          {t('back')}
        </Link>
      </div>
    )
  }

  const { transaction, store } = result
  const items = JSON.parse(transaction.items || '[]')

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/dashboard/transactions" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
        {t('back')}
      </Link>

      <div className="rounded-xl border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">{transaction.id.slice(0, 8)}...</h1>
          <span className={`text-xs px-3 py-1 rounded-full ${STATUS_COLORS[transaction.status] || 'bg-gray-100'}`}>
            {STATUS_LABELS[transaction.status]?.[locale === 'ar' ? 'ar' : 'en'] || transaction.status}
          </span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('transactionStore')}</span>
            <span className="font-medium">{store.nameAr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('transactionDate')}</span>
            <span>{new Date(transaction.createdAt).toLocaleDateString('ar-IQ')}</span>
          </div>
          {transaction.paymentMethod && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('paymentMethods')}</span>
              <span>{transaction.paymentMethod}</span>
            </div>
          )}
          {store.phone && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('phone')}</span>
              <span dir="ltr">{store.phone}</span>
            </div>
          )}
          {store.address && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('address')}</span>
              <span>{store.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      {items.length > 0 && (
        <div className="rounded-xl border p-6 mb-6">
          <h2 className="font-bold mb-4">{t('transactionParts')}</h2>
          <div className="space-y-2">
            {items.map((item: { name?: string; partNumber?: string; quantity?: number; price?: number }, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{item.name || `#${index + 1}`}</p>
                  {item.partNumber && <p className="text-xs text-muted-foreground">{item.partNumber}</p>}
                </div>
                <div className="text-left">
                  <p className="font-medium">{Number(item.price || 0).toLocaleString()} د.ع</p>
                  {item.quantity && item.quantity > 1 && (
                    <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t font-bold">
            <span>{t('transactionAmount')}</span>
            <span>{Number(transaction.totalAmount).toLocaleString()} د.ع</span>
          </div>
        </div>
      )}

      {/* Notes */}
      {transaction.notes && (
        <div className="rounded-xl border p-6">
          <h2 className="font-bold mb-2">{t('description')}</h2>
          <p className="text-sm text-muted-foreground">{transaction.notes}</p>
        </div>
      )}

      {/* Dispute Button */}
      {transaction.status === 'completed' && (
        <div className="mt-6">
          <Link
            href={`/dashboard/disputes/new?transactionId=${transaction.id}`}
            className="inline-block rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            {t('openDispute')}
          </Link>
        </div>
      )}
    </div>
  )
}
