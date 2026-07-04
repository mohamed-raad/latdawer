'use client'

import { useEffect } from 'react'

let sentryInit = false

export function initSentry() {
  if (sentryInit || process.env.NODE_ENV !== 'production' || !process.env.NEXT_PUBLIC_SENTRY_DSN) return
  try {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0.5,
      })
      sentryInit = true
    })
  } catch {
    console.warn('Sentry init failed')
  }
}

export function SentryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => { initSentry() }, [])
  return <>{children}</>
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.withScope((scope) => {
        if (context) scope.setExtras(context)
        Sentry.captureException(error)
      })
    }).catch(() => {})
  } else {
    console.error('Error:', error, context)
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureMessage(message, level)
    }).catch(() => {})
  } else {
    console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](`[${level}]`, message)
  }
}
