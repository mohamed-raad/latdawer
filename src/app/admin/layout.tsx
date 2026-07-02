'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSession } from '@/hooks/use-session'
import { ToggleButtons } from '@/components/toggle-buttons'

const navItems = [
  { href: '/admin', label: 'لوحة التحكم' },
  { href: '/admin/users', label: 'المستخدمين' },
  { href: '/admin/stores', label: 'المتاجر' },
  { href: '/admin/categories', label: 'الفئات' },
  { href: '/admin/manufacturers', label: 'المصنعين' },
  { href: '/admin/subscriptions', label: 'الاشتراكات' },
  { href: '/admin/workflows', label: 'الأتمتة وسير العمل' },
  { href: '/admin/ai', label: 'المساعد الذكي' },
  { href: '/admin/agents', label: 'وكلاء AI' },
  { href: '/admin/audit-logs', label: 'السجلات' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useSession()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">جارٍ التحميل...</p>
      </div>
    )
  }

  if (!user || (user.role !== 'Admin' && user.role !== 'SuperAdmin')) {
    router.push('/login')
    return null
  }

  return (
    <div className="flex min-h-screen">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-64 border-l bg-background transition-transform lg:relative lg:translate-x-0 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-lg font-bold">الإدارة</span>
        </div>
        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-foreground/10 font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground truncate mb-2">
            {user.email}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-6">
          <button
            className="lg:hidden text-2xl"
            onClick={() => setOpen(true)}
          >
            ☰
          </button>
          <div className="flex-1" />
          <ToggleButtons />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
