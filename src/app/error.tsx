'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">500</h1>
      <h2 className="mt-4 text-2xl font-bold">خطأ في الخادم</h2>
      <p className="mt-2 text-muted-foreground">
        عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
      </p>
      <div className="mt-6 flex gap-4">
        <button
          onClick={reset}
          className="rounded-lg bg-foreground px-6 py-3 text-background hover:opacity-90"
        >
          المحاولة مرة أخرى
        </button>
        <Link
          href="/"
          className="rounded-lg border px-6 py-3 hover:bg-muted"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  )
}