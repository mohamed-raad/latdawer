'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useSession } from '@/hooks/use-session'

interface PriceAlertButtonProps {
  partId: string
  currentPrice: number
}

export function PriceAlertButton({ partId, currentPrice }: PriceAlertButtonProps) {
  const { user } = useSession()
  const [showInput, setShowInput] = useState(false)
  const [targetPrice, setTargetPrice] = useState('')

  const { data: alerts } = trpc.features.listPriceAlerts.useQuery(undefined, { enabled: !!user })
  const createMutation = trpc.features.createPriceAlert.useMutation({
    onSuccess: () => { setShowInput(false); setTargetPrice('') }
  })
  const deleteMutation = trpc.features.deletePriceAlert.useMutation()

  const existingAlert = alerts?.find(a => a.partId === partId && a.enabled)

  if (!user) return null

  if (existingAlert) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-green-600">✓ مراقب السعر</span>
        <button
          onClick={() => deleteMutation.mutate({ id: existingAlert.id })}
          className="text-xs text-red-500 hover:text-red-700"
        >
          إلغاء
        </button>
      </div>
    )
  }

  if (showInput) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          placeholder={`السعر الحالي: ${currentPrice.toLocaleString()}`}
          className="w-24 rounded-lg border px-2 py-1 text-xs outline-none"
        />
        <button
          onClick={() => {
            if (targetPrice) {
              createMutation.mutate({
                partId,
                targetPrice: Number(targetPrice),
              })
            }
          }}
          className="rounded-lg bg-amber-500 px-2 py-1 text-xs text-white"
        >
          ✓
        </button>
        <button
          onClick={() => setShowInput(false)}
          className="text-xs text-muted-foreground"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowInput(true)}
      className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      راقب السعر
    </button>
  )
}