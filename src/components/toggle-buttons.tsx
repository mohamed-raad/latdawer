'use client'

import { useTheme } from '@/providers/theme-provider'
import { useLanguage } from '@/lib/i18n'
export function ToggleButtons({ className = '' }: { className?: string }) {
  const { dark, toggle } = useTheme()
  const { locale, toggleLang, t } = useLanguage()

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={toggle}
        className="rounded-md p-2 hover:bg-muted transition-colors"
        aria-label={dark ? t('lightMode') : t('darkMode')}
        title={dark ? t('lightMode') : t('darkMode')}
      >
        {dark ? (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
      <button
        onClick={toggleLang}
        className="rounded-md p-2 hover:bg-muted transition-colors text-sm font-medium"
        aria-label={t('language')}
        title={t('language')}
      >
        <span className="md:hidden">
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <span className="hidden md:inline">{locale === 'ar' ? 'EN' : locale === 'en' ? 'KU' : 'AR'}</span>
      </button>
    </div>
  )
}
