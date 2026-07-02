'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

interface ThemeContext {
  dark: boolean
  toggle: () => void
}

const ThemeCtx = createContext<ThemeContext>({ dark: false, toggle: () => {} })

export function useTheme() {
  return useContext(ThemeCtx)
}

function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem('theme')
  if (stored === 'dark') return true
  if (stored === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(getInitialTheme)

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev
      localStorage.setItem('theme', next ? 'dark' : 'light')
      applyTheme(next)
      return next
    })
  }, [])

  useEffect(() => {
    applyTheme(dark)
  }, [dark])

  return <ThemeCtx.Provider value={{ dark, toggle }}>{children}</ThemeCtx.Provider>
}
