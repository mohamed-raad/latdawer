'use client'

import { use, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { QRCode } from '@/components/qr-code'
import { Onboarding } from '@/components/onboarding'

export default function StoreQRPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: store } = trpc.stores.byId.useQuery({ id })
  const [showOnboarding, setShowOnboarding] = useState(false)

  if (!store) {
    return <div className="p-6 text-center text-muted-foreground">جارٍ التحميل...</div>
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const storeUrl = `${appUrl}/stores/${id}`
  const installUrl = `${appUrl}?install=true`

  const handleShare = (platform: string) => {
    const message = `مرحباً! تفضل متجر ${store.nameAr || store.name} على تطبيق سنترال بارتس فايندر\n\n${storeUrl}\n\nابحث عن أي قطعة غيار بسهولة!`

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`, '_blank')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank')
        break
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(storeUrl)}&text=${encodeURIComponent(message)}`, '_blank')
        break
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {showOnboarding && (
        <Onboarding type="store" onComplete={() => setShowOnboarding(false)} />
      )}

      <h1 className="text-2xl font-bold mb-6">مشاركة المتجر</h1>

      {/* QR Code */}
      <div className="rounded-xl border p-6 text-center mb-6">
        <h2 className="font-bold mb-4">QR Code للمتجر</h2>
        <div className="flex justify-center mb-4">
          <QRCode value={storeUrl} size={250} />
        </div>
        <p className="text-sm text-muted-foreground mb-4">امسح الرمز للانتقال للمتجر</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => {
              const link = document.createElement('a')
              link.download = `qr-${store.nameAr || store.name}.png`
              link.href = document.querySelector('canvas')?.toDataURL() || ''
              link.click()
            }}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            تحميل QR
          </button>
        </div>
      </div>

      {/* App Installation */}
      <div className="rounded-xl border p-6 mb-6">
        <h2 className="font-bold mb-4">تثبيت التطبيق</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <span className="text-2xl">📱</span>
            <div>
              <p className="font-medium text-sm">iPhone / iPad</p>
              <p className="text-xs text-muted-foreground">افتح الرابط في Safari ثم اضغط &quot;إضافة إلى الشاشة الرئيسية&quot;</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-medium text-sm">Android</p>
              <p className="text-xs text-muted-foreground">افتح الرابط في Chrome ثم اضغط &quot;تثبيت التطبيق&quot;</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <QRCode value={installUrl} size={150} />
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">امسح لتثبيت التطبيق</p>
      </div>

      {/* Quick Guide */}
      <div className="rounded-xl border p-6 mb-6">
        <h2 className="font-bold mb-4">دليل سريع للمتجر</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="rounded-full bg-foreground text-background w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
            <div>
              <p className="font-medium text-sm">إضافة المخزون</p>
              <p className="text-xs text-muted-foreground">من لوحة التحكم → المخزون → إضافة جديد</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="rounded-full bg-foreground text-background w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
            <div>
              <p className="font-medium text-sm">استخدام المساعد الذكي</p>
              <p className="text-xs text-muted-foreground">اكتب ما عندك من قطع وسيساعدك إضافتها</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="rounded-full bg-foreground text-background w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
            <div>
              <p className="font-medium text-sm">استقبال الطلبات</p>
              <p className="text-xs text-muted-foreground">ستصل الطلبات مباشرة على واتساب</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowOnboarding(true)}
          className="mt-4 w-full rounded-lg border py-2 text-sm"
        >
          شغل الدليل التفاعلي
        </button>
      </div>

      {/* Share Buttons */}
      <div className="rounded-xl border p-6">
        <h2 className="font-bold mb-4">مشاركة المتجر</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleShare('whatsapp')}
            className="flex items-center justify-center gap-2 rounded-lg bg-green-600 py-3 text-white text-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            واتساب
          </button>
          <button
            onClick={() => handleShare('facebook')}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-white text-sm"
          >
            فيسبوك
          </button>
          <button
            onClick={() => handleShare('twitter')}
            className="flex items-center justify-center gap-2 rounded-lg bg-sky-500 py-3 text-white text-sm"
          >
            تويتر
          </button>
          <button
            onClick={() => handleShare('telegram')}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-400 py-3 text-white text-sm"
          >
            تيليجرام
          </button>
        </div>
      </div>
    </div>
  )
}