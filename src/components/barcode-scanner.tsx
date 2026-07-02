'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useRouter } from 'next/navigation'

export function BarcodeScanner() {
  const [barcode, setBarcode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ found: boolean; partId?: string } | null>(null)
  const router = useRouter()

  const scanMutation = trpc.features.scanBarcode.useMutation({
    onSuccess: (data) => {
      setResult({ found: !!data.part, partId: data.part?.id })
      setScanning(false)
      if (data.part?.id) {
        setTimeout(() => router.push(`/parts/${data.part.id}`), 1500)
      }
    },
    onError: () => setScanning(false),
  })

  const handleScan = () => {
    if (!barcode.trim()) return
    setScanning(true)
    scanMutation.mutate({ barcode: barcode.trim() })
  }

  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-lg font-bold mb-4">مسح الباركود</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          placeholder="أدخل رقم الباركود..."
          className="flex-1 rounded-lg border px-4 py-2 text-sm outline-none"
          dir="ltr"
        />
        <button
          onClick={handleScan}
          disabled={scanning || !barcode.trim()}
          className="rounded-lg bg-foreground px-6 py-2 text-sm text-background disabled:opacity-50"
        >
          {scanning ? '...' : 'بحث'}
        </button>
      </div>

      <div className="text-center text-sm text-muted-foreground mb-4">
        أو استخدم كاميرا الهاتف لمسح الباركود
      </div>

      {result && (
        <div className={`rounded-lg p-4 text-center ${result.found ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {result.found ? (
            <p>✓ تم العثور على القطعة! جارٍ التحويل...</p>
          ) : (
            <p>✕ لم يتم العثور على القطعة في قاعدة البيانات</p>
          )}
        </div>
      )}
    </div>
  )
}