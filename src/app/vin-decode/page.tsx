'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'

interface VinDecodeResult {
  Make: string; Model: string; ModelYear: string
  EngineCylinders: string; DisplacementL: string; FuelType: string
  Trim: string; VehicleType: string
}

interface VinVariable {
  Variable: string
  Value: string | null
}

function findVinResult(results: VinVariable[], variable: string): string {
  return results.find((x) => x.Variable === variable)?.Value || ''
}

export default function VinDecodePage() {
  const [vin, setVin] = useState('')
  const [decoded, setDecoded] = useState<VinDecodeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedVehicleId, setSavedVehicleId] = useState('')

  const addToGarage = trpc.garage.add.useMutation()

  async function handleDecode() {
    const v = vin.trim().toUpperCase()
    if (v.length !== 17) { setError('رقم الشاصي يجب أن يكون 17 خانة'); return }
    setLoading(true); setError(''); setDecoded(null)
    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVIN/${v}?format=json`)
      const data = await res.json()
      const results: VinVariable[] = data.Results || []
      const r: VinDecodeResult = {
        Make: findVinResult(results, 'Make'),
        Model: findVinResult(results, 'Model'),
        ModelYear: findVinResult(results, 'Model Year'),
        EngineCylinders: findVinResult(results, 'Engine Cylinders'),
        DisplacementL: findVinResult(results, 'Displacement (L)'),
        FuelType: findVinResult(results, 'Fuel Type - Primary'),
        Trim: findVinResult(results, 'Trim'),
        VehicleType: findVinResult(results, 'Vehicle Type'),
      }
      if (!r.Make) throw new Error('لم نتمكن من فك رقم الشاصي. تأكد من الرقم.')
      setDecoded(r)
      setSavedVehicleId('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'حدث خطأ أثناء فك رقم الشاصي')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveToGarage() {
    if (!decoded) return
    try {
      const res = await fetch(`/api/trpc/vehicles.search?batch=1&input=${encodeURIComponent(JSON.stringify({ "0": { "q": `${decoded.Make} ${decoded.Model}` } }))}`)
      const json = await res.json()
      const vehicles = json?.[0]?.result?.data?.json
      if (vehicles?.length > 0) {
        await addToGarage.mutateAsync({ vehicleId: vehicles[0].id, nickname: `${decoded.Make} ${decoded.Model} (${decoded.ModelYear})` })
        setSavedVehicleId(vehicles[0].id)
      } else {
        setError('لم نعثر على هذه المركبة في قاعدة البيانات')
      }
    } catch {
      setError('حدث خطأ أثناء الحفظ')
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">فك رقم الشاصي (VIN Decoder)</h1>
      <p className="mt-1 text-muted-foreground">أدخل رقم الشاصي المكون من 17 خانة لمعرفة معلومات السيارة</p>

      <div className="mt-6 flex gap-2">
        <input value={vin} onChange={(e) => setVin(e.target.value.toUpperCase())} placeholder="مثال: JTEBU29J123456789" maxLength={17} dir="ltr" className="flex-1 rounded-lg border px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-foreground/20" />
        <button onClick={handleDecode} disabled={loading || vin.length !== 17} className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
          {loading ? 'جارٍ الفك...' : 'فك'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {decoded && (
        <div className="mt-6 rounded-xl border bg-background p-6">
          <h2 className="text-lg font-bold">{decoded.Make} {decoded.Model} ({decoded.ModelYear})</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">الشركة:</span> <span className="font-medium">{decoded.Make}</span></div>
            <div><span className="text-muted-foreground">الموديل:</span> <span className="font-medium">{decoded.Model}</span></div>
            <div><span className="text-muted-foreground">السنة:</span> <span className="font-medium">{decoded.ModelYear}</span></div>
            <div><span className="text-muted-foreground">النوع:</span> <span className="font-medium">{decoded.VehicleType}</span></div>
            <div><span className="text-muted-foreground">السلندرات:</span> <span className="font-medium">{decoded.EngineCylinders}</span></div>
            <div><span className="text-muted-foreground">سعة المحرك:</span> <span className="font-medium">{decoded.DisplacementL} لتر</span></div>
            <div><span className="text-muted-foreground">الوقود:</span> <span className="font-medium">{decoded.FuelType}</span></div>
            {decoded.Trim && <div><span className="text-muted-foreground">الفئة:</span> <span className="font-medium">{decoded.Trim}</span></div>}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {savedVehicleId ? (
              <Link href="/garage" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">✓ تم الحفظ - عرض المرآب</Link>
            ) : (
              <button onClick={handleSaveToGarage} disabled={addToGarage.isPending} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
                {addToGarage.isPending ? 'جارٍ الحفظ...' : 'حفظ في مرآبي'}
              </button>
            )}
            <Link href={`/search?q=${encodeURIComponent(decoded.Make + ' ' + decoded.Model)}`} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">بحث عن قطع مناسبة</Link>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-xl border bg-muted/30 p-6">
        <h3 className="font-bold text-sm">ما هو رقم الشاصي (VIN)؟</h3>
        <p className="mt-2 text-sm text-muted-foreground">رقم الشاصي هو معرف فريد مكون من 17 حرفاً لكل مركبة. تجده على لوحة القيادة بالقرب من الزجاج الأمامي، أو على الهيكل في باب السائق، أو في كرت السيارة (الاستمارة).</p>
      </div>
    </div>
  )
}
