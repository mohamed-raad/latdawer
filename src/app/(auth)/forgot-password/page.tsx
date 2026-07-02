'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-2xl font-bold">{t('forgotPassword')}</h1>

        {success ? (
          <div className="rounded-xl border p-6 text-center">
            <div className="mb-4 text-4xl">📧</div>
            <h2 className="mb-2 text-lg font-bold">{t('resetEmailSent')}</h2>
            <p className="mb-4 text-muted-foreground">{t('resetEmailDescription')}</p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-foreground px-6 py-2 text-background"
            >
              {t('backToLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-muted-foreground">{t('forgotPasswordDescription')}</p>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">{t('email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-foreground/20"
                placeholder="mr991199@gmail.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-foreground py-2 text-background disabled:opacity-50"
            >
              {loading ? t('loading') : t('sendResetLink')}
            </button>

            <p className="text-center text-sm">
              <Link href="/login" className="text-foreground hover:underline">
                {t('backToLogin')}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}