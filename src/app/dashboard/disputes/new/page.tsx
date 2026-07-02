'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'

export default function NewDisputePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const transactionId = searchParams.get('transactionId')
  const { t } = useLanguage()

  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')

  const { data: transaction } = trpc.transactions.get.useQuery(
    { id: transactionId! },
    { enabled: !!transactionId }
  )

  const createDisputeMutation = trpc.disputes.create.useMutation({
    onSuccess: () => {
      router.push('/dashboard/disputes')
    },
  })

  const handleSubmit = () => {
    if (reason.trim() && transaction) {
      createDisputeMutation.mutate({
        transactionId: transaction.transaction.id,
        storeId: transaction.store.id,
        reason,
        description: description || undefined,
      })
    }
  }

  if (!transactionId || !transaction) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <p className="text-muted-foreground mb-4">{t('loading')}</p>
        <Link href="/dashboard/transactions" className="text-sm hover:text-foreground">
          {t('transactions')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/dashboard/disputes" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
        {t('back')}
      </Link>

      <h1 className="text-xl font-bold mb-6">{t('openDispute')}</h1>

      <div className="rounded-xl border p-6 mb-6">
        <p className="text-sm text-muted-foreground mb-2">{t('transactionStore')}</p>
        <p className="font-medium">{transaction.store.nameAr}</p>
        <p className="text-xs text-muted-foreground mt-1">
          #{transaction.transaction.id.slice(0, 8)} - {new Date(transaction.transaction.createdAt).toLocaleDateString('ar-IQ')}
        </p>
        <p className="text-sm font-bold mt-2">{Number(transaction.transaction.totalAmount).toLocaleString()} د.ع</p>
      </div>

      <div className="rounded-xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('disputeReason')} *</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('disputeReason')}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('disputeDetails')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('disputeDetails')}
            rows={4}
            className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Link
            href="/dashboard/disputes"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
          >
            {t('cancel')}
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || createDisputeMutation.isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            {createDisputeMutation.isPending ? t('loading') : t('submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
