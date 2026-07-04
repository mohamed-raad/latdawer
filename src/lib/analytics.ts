'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function PlausibleAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) return
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    window.plausible?.('pageview', { url })
  }, [pathname, searchParams])

  return null
}

export function trackEvent(name: string, props?: Record<string, string | number>) {
  if (process.env.NODE_ENV !== 'production') { console.log('[Analytics]', name, props); return }
  window.plausible?.(name, { props })
}

declare global { interface Window { plausible?: (event: string, options?: { url?: string; props?: Record<string, string | number> }) => void } }
