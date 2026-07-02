'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/use-session'
import { trpc } from '@/lib/trpc/client'

export default function AddVehiclePage() {
  const router = useRouter()
  const { user, loading: sessionLoading } = useSession()

  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [nickname, setNickname] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [error, setError] = useState('')
  const [yearOptions, setYearOptions] = useState<{ year: string; engine: string | null; trim: string | null; id: string }[]>([])

  const { data: makes } = trpc.garage.makes.useQuery()
  const { data: models, refetch: refetchModels } = trpc.garage.models.useQuery({ make }, { enabled: false })
  const { refetch: refetchYears } = trpc.garage.years.useQuery({ make, model }, { enabled: false })

  const addVehicle = trpc.garage.add.useMutation({
    onSuccess: () => router.push('/garage'),
    onError: (e) => setError(e.message),
  })

  if (sessionLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">جارٍ التحميل...</p></div>
  if (!user) { router.push('/login'); return null }

  function handleMakeChange(value: string) {
    setMake(value)
    setModel('')
    setVehicleId('')
    setYearOptions([])
    if (value) refetchModels()
  }

  function handleModelChange(value: string) {
    setModel(value)
    setVehicleId('')
    setYearOptions([])
    if (value) refetchYears().then((r) => { if (r.data) setYearOptions(r.data) })
  }

  function handleSelectVehicle(y: typeof yearOptions[0]) {
    setVehicleId(y.id)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!vehicleId) { setError('يرجى اختيار المركبة'); return }
    addVehicle.mutate({ vehicleId, nickname: nickname.trim() || undefined, licensePlate: licensePlate.trim() || undefined })
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold">إضافة مركبة</h1>
      <p className="mt-1 text-muted-foreground">أضف سيارتك لترى القطع المناسبة لها</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">الشركة المصنعة</label>
          <select value={make} onChange={(e) => handleMakeChange(e.target.value)} className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20">
            <option value="">اختر الشركة</option>
            {makes?.map((m) => <option key={m.make} value={m.make}>{m.makeAr}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">الموديل</label>
          <select value={model} onChange={(e) => handleModelChange(e.target.value)} disabled={!make} className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50">
            <option value="">اختر الموديل</option>
            {models?.map((m) => <option key={m.model} value={m.model}>{m.modelAr}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">السنة والمحرك</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {yearOptions.length > 0 ? yearOptions.map((y) => (
              <button key={y.id} type="button" onClick={() => handleSelectVehicle(y)} className={`rounded-lg border p-3 text-right text-sm transition-colors hover:bg-muted ${vehicleId === y.id ? 'border-foreground bg-foreground/5 font-medium' : ''}`}>
                <span className="block">{y.year}</span>
                {y.engine && <span className="block text-xs text-muted-foreground">{y.engine}</span>}
                {y.trim && <span className="block text-xs text-muted-foreground">{y.trim}</span>}
              </button>
            )) : model && <p className="col-span-2 text-sm text-muted-foreground">لا توجد بيانات متاحة</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">لقب (اختياري)</label>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="مثال: العربية البيضاء" className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20" />
          </div>
          <div>
            <label className="block text-sm font-medium">رقم اللوحة (اختياري)</label>
            <input value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} placeholder="مثال: 12345" className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20" />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={addVehicle.isPending} className="w-full rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
          {addVehicle.isPending ? 'جارٍ الحفظ...' : 'حفظ المركبة'}
        </button>
      </form>
    </div>
  )
}
