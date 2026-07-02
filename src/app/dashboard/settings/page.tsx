'use client'

import { useState } from 'react'
import { useSession } from '@/hooks/use-session'
import { useGeolocation } from '@/hooks/use-geolocation'
import { trpc } from '@/lib/trpc/client'
import { NotificationBell } from '@/components/notification-bell'

export default function SettingsPage() {
  const { user } = useSession()
  const { latitude, longitude, loading: geoLoading, error: geoError, getCurrentLocation } = useGeolocation()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [city, setCity] = useState(user?.city || '')

  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => setEditing(false),
  })

  const loyaltyQuery = trpc.features.getLoyaltyBalance.useQuery()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">الإعدادات</h1>
          <p className="text-sm text-muted-foreground">إدارة إعدادات حسابك</p>
        </div>
        <NotificationBell />
      </div>

      {/* Profile Section */}
      <div className="rounded-xl border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">الملف الشخصي</h2>
          <button
            onClick={() => setEditing(!editing)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {editing ? 'إلغاء' : 'تعديل'}
          </button>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">الاسم</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">الهاتف</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">المدينة</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              />
            </div>
            <button
              onClick={() => updateMutation.mutate({ name, phone, city })}
              disabled={updateMutation.isPending}
              className="rounded-lg bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
            >
              {updateMutation.isPending ? '...' : 'حفظ'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">الاسم</span>
              <span className="text-sm font-medium">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">البريد الإلكتروني</span>
              <span className="text-sm font-medium" dir="ltr">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">الهاتف</span>
              <span className="text-sm font-medium" dir="ltr">{user?.phone || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">المدينة</span>
              <span className="text-sm font-medium">{user?.city || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">الدور</span>
              <span className="text-sm font-medium">{user?.role}</span>
            </div>
          </div>
        )}
      </div>

      {/* GPS Location Section */}
      <div className="rounded-xl border p-6 mb-6">
        <h2 className="font-bold mb-4">الموقع</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">خط العرض</span>
            <span className="text-sm font-medium" dir="ltr">{latitude?.toFixed(6) || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">خط الطول</span>
            <span className="text-sm font-medium" dir="ltr">{longitude?.toFixed(6) || '—'}</span>
          </div>
          <button
            onClick={getCurrentLocation}
            disabled={geoLoading}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            {geoLoading ? 'جارٍ تحديد الموقع...' : 'تحديث الموقع'}
          </button>
          {geoError && <p className="text-xs text-red-500">{geoError}</p>}
        </div>
      </div>

      {/* Loyalty Section */}
      <div className="rounded-xl border p-6">
        <h2 className="font-bold mb-4">نقاط الولاء</h2>
        <div className="text-center">
          <p className="text-3xl font-bold">{loyaltyQuery.data ?? 0}</p>
          <p className="text-sm text-muted-foreground">نقطة</p>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          اجمع النقاط من عمليات الشراء واستبدلها بخصومات
        </p>
      </div>
    </div>
  )
}