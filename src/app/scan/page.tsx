'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ScanPage() {
  const router = useRouter()
  const [code, setCode] = useState('')

  const handleSearch = () => {
    if (!code.trim()) return
    router.push(`/search?q=${encodeURIComponent(code.trim())}`)
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12" dir="rtl">
      <Link href="/search" className="text-sm text-muted-foreground hover:underline">
        &larr; العودة للبحث
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-center">مسح الباركود</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        امسح الباركود أو أدخل رقم القطعة يدوياً
      </p>

      <div className="mt-8 flex justify-center">
        <div className="flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/30">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V3m0 0h6M3 3l4.5 4.5M21 3v6m0-6h-6m6 0l-4.5 4.5M3 15v6m0 0h6m-6 0l4.5-4.5M21 21v-6m0 6h-6m6 0l-4.5-4.5" />
            </svg>
            <p className="mt-2 text-xs text-muted-foreground">الكاميرا</p>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="ادخل رقم القطعة أو امسح الباركود"
          className="h-12 w-full rounded-xl border px-4 text-center text-lg outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <button
          onClick={handleSearch}
          disabled={!code.trim()}
          className="w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background disabled:opacity-50"
        >
          بحث
        </button>
      </div>

      <div className="mt-8 rounded-xl border p-6">
        <h2 className="text-sm font-bold mb-3">كيفية المسح</h2>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>1. افتح تطبيق الكاميرا على هاتفك</li>
          <li>2. وجّه الكاميرا نحو الباركود الموجود على علبة القطعة</li>
          <li>3. سيتم التعرف على الرقم تلقائياً</li>
          <li>4. أو أدخل الرقم يدوياً في الحقل أعلاه</li>
        </ol>
      </div>
    </div>
  )
}
