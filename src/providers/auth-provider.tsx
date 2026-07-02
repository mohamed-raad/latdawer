'use client'

import { SessionProvider } from '@/hooks/use-session'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
