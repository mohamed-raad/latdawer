'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import ar from './ar'
import en from './en'
import ku from './ku'

export type Dict = Record<string, string>
export type Locale = 'ar' | 'en' | 'ku'

const dicts: Record<Locale, Dict> = { ar, en, ku }

interface LangContext {
  locale: Locale
  t: (key: string, fallback?: string) => string
  toggleLang: () => void
  dir: 'rtl' | 'ltr'
}

const LangCtx = createContext<LangContext>({
  locale: 'ar',
  t: (k: string) => ar[k] || k,
  toggleLang: () => {},
  dir: 'rtl',
})

export function useLanguage() {
  return useContext(LangCtx)
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ar'
  const saved = localStorage.getItem('locale') as Locale | null
  return saved === 'en' || saved === 'ar' || saved === 'ku' ? saved : 'ar'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale)

  useEffect(() => {
    localStorage.setItem('locale', locale)
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
  }, [locale])

  const t = useCallback((key: string, fallback?: string) => {
    const dict = dicts[locale]
    return dict[key] || fallback || ar[key] || key
  }, [locale])

  const toggleLang = useCallback(() => {
    setLocale((prev) => {
      if (prev === 'ar') return 'en'
      if (prev === 'en') return 'ku'
      return 'ar'
    })
  }, [])

  return (
    <LangCtx.Provider value={{ locale, t, toggleLang, dir: locale === 'ar' ? 'rtl' : 'ltr' }}>
      {children}
    </LangCtx.Provider>
  )
}
