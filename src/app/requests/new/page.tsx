'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/use-session'
import { trpc } from '@/lib/trpc/client'
import { IRAQI_CITIES } from '@/constants'

export default function NewRequestPage() {
  const router = useRouter()
  const { user, loading: sessionLoading } = useSession()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [partNumber, setPartNumber] = useState('')
  const [vehicleMake, setVehicleMake] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleYear, setVehicleYear] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')

  const create = trpc.requests.create.useMutation({
    onSuccess: (data) => router.push(`/requests/${data.id}`),
    onError: (e) => setError(e.message),
  })

  if (sessionLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">جارٍ التحميل...</p></div>
  if (!user) { router.push('/login'); return null }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('عنوان الطلب مطلوب'); return }
    if (!city) { setError('يرجى اختيار المدينة'); return }
    create.mutate({ title: title.trim(), description: description.trim() || undefined, partNumber: partNumber.trim() || undefined, vehicleMake: vehicleMake.trim() || undefined, vehicleModel: vehicleModel.trim() || undefined, vehicleYear: vehicleYear.trim() || undefined, city })
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">طلب قطعة</h1>
      <p className="mt-1 text-muted-foreground">لم تجد القطعة التي تبحث عنها؟ أرسل طلباً للمتاجر في مدينتك</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">عنوان الطلب *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: بكرة دينمو تويوتا لاند كروزر 2024" className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20" />
        </div>

        <div>
          <label className="block text-sm font-medium">تفاصيل إضافية</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="وصف القطعة، المواصفات، الملاحظات..." className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">رقم القطعة</label>
            <input value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="27415-0W040" dir="ltr" className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20" />
          </div>
          <div>
            <label className="block text-sm font-medium">المدينة *</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20">
              <option value="">اختر المدينة</option>
              {IRAQI_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <fieldset className="rounded-lg border p-4">
          <legend className="text-sm font-medium">معلومات المركبة (اختياري)</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium">الماركة</label>
              <input value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} placeholder="تويوتا" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20" />
            </div>
            <div>
              <label className="block text-xs font-medium">الموديل</label>
              <input value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="لاند كروزر" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20" />
            </div>
            <div>
              <label className="block text-xs font-medium">السنة</label>
              <input value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} placeholder="2024" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20" />
            </div>
          </div>
        </fieldset>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={create.isPending} className="w-full rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
          {create.isPending ? 'جارٍ الإرسال...' : 'إرسال الطلب'}
        </button>
      </form>
    </div>
  )
}
