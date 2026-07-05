'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/hooks/use-session'
import { useLanguage } from '@/lib/i18n'
import { ToggleButtons } from '@/components/toggle-buttons'
import { NotificationBell } from '@/components/notification-bell'

const POPULAR_MAKES = [
  { name: 'Toyota', nameAr: 'تويوتا', logo: 'https://cdn.worldvectorlogo.com/logos/toota-4.svg' },
  { name: 'Nissan', nameAr: 'نيسان', logo: 'https://cdn.worldvectorlogo.com/logos/nissan-6.svg' },
  { name: 'Hyundai', nameAr: 'هيونداي', logo: 'https://cdn.worldvectorlogo.com/logos/hyundai-6.svg' },
  { name: 'Kia', nameAr: 'كيا', logo: 'https://cdn.worldvectorlogo.com/logos/kia-2.svg' },
  { name: 'Chevrolet', nameAr: 'شيفروليه', logo: 'https://cdn.worldvectorlogo.com/logos/chevrolet-6.svg' },
  { name: 'Ford', nameAr: 'فورد', logo: 'https://cdn.worldvectorlogo.com/logos/ford-6.svg' },
  { name: 'BMW', nameAr: 'بي ام دبليو', logo: 'https://cdn.worldvectorlogo.com/logos/bmw-2.svg' },
  { name: 'Mercedes', nameAr: 'مرسيدس', logo: 'https://cdn.worldvectorlogo.com/logos/mercedes-benz-9.svg' },
  { name: 'Honda', nameAr: 'هوندا', logo: 'https://cdn.worldvectorlogo.com/logos/honda-1.svg' },
  { name: 'Mitsubishi', nameAr: 'ميتسوبيشي', logo: 'https://cdn.worldvectorlogo.com/logos/mitsubishi-2.svg' },
  { name: 'Suzuki', nameAr: 'سوزوكي', logo: 'https://cdn.worldvectorlogo.com/logos/suzuki-1.svg' },
  { name: 'Mazda', nameAr: 'مازدا', logo: 'https://cdn.worldvectorlogo.com/logos/mazda-2.svg' },
]

const HOW_IT_WORKS = [
  { step: '1', titleAr: 'دور القطعة', descAr: 'اكتب اسم القطعة أو رقمها أو نوع سيارتك', icon: '🔍' },
  { step: '2', titleAr: 'قارن الأسعار', descAr: 'شوف اسعار المتاجر القريبة منك', icon: '⚖️' },
  { step: '3', titleAr: 'تواصل واطلب', descAr: 'كلم المتجر عبر واتساب أو الاتصال', icon: '💬' },
]

export default function Home() {
  const { user, loading } = useSession()
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background text-lg font-bold">
              ل
            </div>
            <span className="text-xl font-bold hidden sm:block">{t('appName')}</span>
          </Link>
          <div className="flex items-center gap-3">
            <ToggleButtons />
            {loading ? null : user ? (
              <>
                <NotificationBell />
                <Link href="/dashboard"
                  className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity">
                  {t('dashboard')}
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium hover:opacity-70 transition-opacity hidden sm:block">
                  {t('login')}
                </Link>
                <Link href="/signup"
                  className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity">
                  {t('signup')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground to-muted" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24">
            <div className="text-center text-background">
              <h2 className="text-4xl font-bold leading-tight sm:text-6xl">
                {t('appTagline')}
              </h2>
              <p className="mt-4 text-lg text-background/70 max-w-xl mx-auto">
                {t('appDesc')}
              </p>

              {/* Search Bar */}
              <div className="mt-10 mx-auto max-w-2xl">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-background/20 to-background/10 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-1000" />
                  <div className="relative flex items-center bg-white/95 dark:bg-background rounded-2xl shadow-2xl">
                    <svg className="ml-4 h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchQuery && (window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`)}
                      placeholder={t('searchPlaceholder')}
                      className="flex-1 bg-transparent py-4 px-2 text-foreground placeholder:text-muted-foreground outline-none text-lg rounded-2xl"
                    />
                    <Link href={searchQuery ? `/search?q=${encodeURIComponent(searchQuery)}` : '/search'}
                      className="mr-2 rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background hover:opacity-90 transition-opacity">
                      {t('search_')}
                    </Link>
                  </div>
                </div>

                {/* Quick suggestions */}
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Link href="/search?q=27415-0W040" className="rounded-full bg-background/10 backdrop-blur px-4 py-1.5 text-sm text-background/80 hover:bg-background/20 transition-colors">
                    بكرة دينمو
                  </Link>
                  <Link href="/search?q=بواجي" className="rounded-full bg-background/10 backdrop-blur px-4 py-1.5 text-sm text-background/80 hover:bg-background/20 transition-colors">
                    بواجي شرارة
                  </Link>
                  <Link href="/search?q=بطارية" className="rounded-full bg-background/10 backdrop-blur px-4 py-1.5 text-sm text-background/80 hover:bg-background/20 transition-colors">
                    بطارية سيارة
                  </Link>
                  <Link href="/search?q=فلتر+زيت" className="rounded-full bg-background/10 backdrop-blur px-4 py-1.5 text-sm text-background/80 hover:bg-background/20 transition-colors">
                    فلتر زيت
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Makes */}
        <section className="mx-auto max-w-7xl px-4 py-12">
          <h3 className="text-lg font-bold mb-6">{t('popularMakes')}</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
            {POPULAR_MAKES.map((make) => (
              <Link key={make.name} href={`/search?q=${make.nameAr}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border p-4 hover:shadow-lg hover:border-foreground/20 transition-all duration-200">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-2 shadow-sm group-hover:scale-110 transition-transform">
                  <img src={make.logo} alt={make.name} className="h-full w-full object-contain" loading="lazy" />
                </div>
                <span className="text-xs font-medium text-center">{make.nameAr}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-16">
            <h3 className="text-2xl font-bold text-center mb-10">كيف تشتغل؟</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {HOW_IT_WORKS.map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-background text-3xl shadow-sm border">
                    {item.icon}
                  </div>
                  <h4 className="mt-4 text-lg font-bold">{item.titleAr}</h4>
                  <p className="mt-2 text-sm text-muted-foreground">{item.descAr}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>{t('appName')} - {t('appTagline')}</p>
      </footer>
    </div>
  )
}
