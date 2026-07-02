'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from '@/hooks/use-session'

const CITIES = [
  'البصرة', 'بغداد', 'أربيل', 'السليمانية', 'دهوك',
  'الموصل', 'كركوك', 'النجف', 'كربلاء', 'الحلة',
  'الناصرية', 'العمارة', 'الديوانية', 'السماوة', 'تكريت',
  'الرمادي', 'الفلوجة', 'واسط', 'ذي قار', 'المثنى',
]

export default function SignupPage() {
  const router = useRouter()
  const { refresh } = useSession()
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    area: '',
    role: 'Customer' as 'Customer' | 'StoreManager',
  })
  const [gps, setGps] = useState<{ lat: string; lng: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          gpsLat: gps?.lat,
          gpsLng: gps?.lng,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'حدث خطأ')
        return
      }

      await refresh()
      router.push('/dashboard')
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleLocate() {
    if (!navigator.geolocation) {
      setError('متصفحك لا يدعم تحديد الموقع')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        })
        setLocating(false)
      },
      () => {
        setError('لم نتمكن من تحديد موقعك. تأكد من صلاحيات الموقع.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">إنشاء حساب جديد</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          أدخل بياناتك لإنشاء حساب
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="mb-1 block text-sm font-medium">الاسم الكامل *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            placeholder="مثال: أحمد علي"
          />
        </div>

        {/* Email */}
        <div>
          <label className="mb-1 block text-sm font-medium">البريد الإلكتروني *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20 ltr text-left"
            placeholder="example@email.com"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="mb-1 block text-sm font-medium">رقم الهاتف *</label>
          <input
            type="tel"
            required
            dir="ltr"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20 ltr text-left"
            placeholder="+964 7XX XXX XXXX"
          />
        </div>

        {/* Password */}
        <div>
          <label className="mb-1 block text-sm font-medium">كلمة المرور *</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20 ltr text-left"
            placeholder="********"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            8 أحرف على الأقل، حرف كبير، حرف صغير، ورقم
          </p>
        </div>

        {/* City */}
        <div>
          <label className="mb-1 block text-sm font-medium">المدينة *</label>
          <select
            required
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20 bg-background"
          >
            <option value="">اختر المدينة</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Area */}
        <div>
          <label className="mb-1 block text-sm font-medium">المنطقة / الحي *</label>
          <input
            type="text"
            required
            value={form.area}
            onChange={(e) => update('area', e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            placeholder="مثال: حي الزهراء، 14 رمضان"
          />
        </div>

        {/* Location Picker */}
        <div>
          <label className="mb-1 block text-sm font-medium">الموقع الجغرافي (اختياري)</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleLocate}
              disabled={locating}
              className="flex-1 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              {locating ? 'جارٍ التحديد...' : gps ? 'تم التحديد ✓' : 'تحديد موقعي الحالي'}
            </button>
            {gps && (
              <button
                type="button"
                onClick={() => setGps(null)}
                className="rounded-lg border px-3 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                مسح
              </button>
            )}
          </div>
          {gps && (
            <p className="mt-1 text-xs text-muted-foreground ltr text-left">
              {gps.lat}, {gps.lng}
            </p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="mb-1 block text-sm font-medium">نوع الحساب</label>
          <select
            value={form.role}
            onChange={(e) => update('role', e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20 bg-background"
          >
            <option value="Customer">مستخدم عادي</option>
            <option value="StoreManager">صاحب متجر</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'جارٍ التسجيل...' : 'إنشاء الحساب'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        لديك حساب بالفعل؟{' '}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  )
}
