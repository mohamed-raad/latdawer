'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'
import { CONDITION_LABELS, STATUS_LABELS } from '@/constants'

export function AddItemFlow({ storeId, onDone, onCancel }: {
  storeId: string
  onDone: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const [mfrId, setMfrId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([''])
  const [step, setStep] = useState<'mfr' | 'vehicle' | 'details'>('mfr')
  const [autoEnhancing, setAutoEnhancing] = useState(false)
  const [iraqiName, setIraqiName] = useState('')

  const { data: specs } = trpc.onboarding.getStoreSpecializations.useQuery()
  const { data: manufacturers } = trpc.onboarding.getManufacturers.useQuery()
  const { data: allCategories } = trpc.onboarding.getCategories.useQuery()

  const selectedMfrName = manufacturers?.find((m) => m.id === mfrId)?.name || ''
  const { data: mfrVehicles } = trpc.onboarding.getVehiclesByMake.useQuery(
    { make: selectedMfrName },
    { enabled: !!selectedMfrName }
  )
  const selectedVehicleIds = specs?.vehicles.map((v) => v.vehicleId) || []
  const availableVehicles = mfrVehicles?.filter((v) => selectedVehicleIds.includes(v.id)) || []

  const selectedCatIds = specs?.categories.map((c) => c.categoryId) || []
  const mainCats = allCategories?.filter((c) => !c.parentId && selectedCatIds.includes(c.id)) || []

  const [form, setForm] = useState({
    partNumber: '', name: '', nameEn: '', price: '', quantity: '1',
    condition: 'new', status: 'active', brand: '', origin: '', notes: '',
  })

  const createPartMutation = trpc.parts.create.useMutation()
  const createInventoryMutation = trpc.inventory.create.useMutation({
    onSuccess: () => onDone(),
  })

  async function handleSubmit() {
    if (!form.name || !form.price) return
    const part = await createPartMutation.mutateAsync({
      nameAr: form.name,
      nameEn: form.nameEn || form.name,
      partNumber: form.partNumber || undefined,
      brand: form.brand || undefined,
      origin: form.origin || undefined,
      categoryId: categoryId || undefined,
      condition: form.condition,
    })
    await createInventoryMutation.mutateAsync({
      storeId,
      partId: part.id,
      price: Number(form.price),
      quantity: Number(form.quantity) || 1,
      condition: form.condition as 'new' | 'used' | 'refurbished' | 'salvage',
      status: form.status as 'active' | 'inactive' | 'out_of_stock',
      notes: form.notes || undefined,
    })
  }

  const selectedVehicle = mfrVehicles?.find((v) => v.id === vehicleId)
  const selectedMfr = manufacturers?.find((m) => m.id === mfrId)

  const storeMfrIds = specs?.manufacturers.map((m) => m.manufacturerId) || []
  const storeManufacturers = manufacturers?.filter((m) => storeMfrIds.includes(m.id)) || []

  async function autoEnhance() {
    if (!form.name || !selectedMfr || !selectedVehicle) return
    setAutoEnhancing(true)
    try {
      const res = await fetch('/api/ai/auto-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId: '',
          inventoryId: '',
          storeId,
          partNameAr: form.name,
          partNumber: form.partNumber || null,
          make: selectedMfr.nameAr || selectedMfr.name,
          model: selectedVehicle.modelAr || selectedVehicle.model,
          year: selectedVehicle.year,
        }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.iraqiName) {
          setIraqiName(data.iraqiName)
          setForm((p) => ({ ...p, name: data.iraqiName }))
        }
        if (data.photoUrls?.length > 0) {
          setImageUrls(data.photoUrls)
        }
      }
    } catch { /* ignore */ }
    setAutoEnhancing(false)
  }

  function addImageUrl() {
    setImageUrls((p) => [...p, ''])
  }

  function removeImageUrl(index: number) {
    setImageUrls((p) => p.filter((_, i) => i !== index))
  }

  function updateImageUrl(index: number, value: string) {
    setImageUrls((p) => p.map((url, i) => i === index ? value : url))
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-bold mb-4">{t('add')} {t('inventory')}</h2>

      <div className="flex items-center gap-2 mb-6 text-sm">
        <span className={step === 'mfr' ? 'font-bold text-foreground' : 'text-muted-foreground'}>1. {t('make')}</span>
        <span className="text-muted-foreground">→</span>
        <span className={step === 'vehicle' ? 'font-bold text-foreground' : 'text-muted-foreground'}>2. {t('model')}</span>
        <span className="text-muted-foreground">→</span>
        <span className={step === 'details' ? 'font-bold text-foreground' : 'text-muted-foreground'}>3. {t('description')}</span>
      </div>

      {step === 'mfr' && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">{t('selectMake')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {storeManufacturers.map((mfr) => (
              <button key={mfr.id} onClick={() => { setMfrId(mfr.id); setStep('vehicle') }}
                className="rounded-xl border-2 p-4 text-center hover:border-foreground/30 hover:shadow-sm transition-all">
                <p className="font-bold">{mfr.nameAr || mfr.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{mfr.country}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'vehicle' && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">{selectedMfr?.nameAr || selectedMfrName}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableVehicles.map((v) => (
              <button key={v.id} onClick={() => { setVehicleId(v.id); setStep('details') }}
                className="rounded-xl border-2 p-4 text-left hover:border-foreground/30 hover:shadow-sm transition-all">
                <p className="font-bold">{v.modelAr || v.model}</p>
                <p className="text-xs text-muted-foreground mt-1">{v.year} - {v.engine}</p>
                {v.trim && <p className="text-xs text-muted-foreground">{v.trim}</p>}
                {v.region && <span className="mt-2 inline-block rounded bg-muted px-2 py-0.5 text-xs">{v.region}</span>}
              </button>
            ))}
          </div>
          <button onClick={() => setStep('mfr')} className="mt-4 text-sm text-muted-foreground hover:text-foreground">← {t('back')}</button>
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-4">
          {selectedVehicle && (
            <div className="rounded-xl bg-muted/50 p-4 mb-4">
              <p className="font-bold">{selectedMfr?.nameAr} {selectedVehicle.modelAr || selectedVehicle.model}</p>
              <p className="text-xs text-muted-foreground">{selectedVehicle.year} - {selectedVehicle.engine} - {selectedVehicle.region}</p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">{t('category')}</label>
            <div className="flex flex-wrap gap-2">
              {mainCats.map((cat) => (
                <button key={cat.id} onClick={() => setCategoryId(cat.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm border transition-colors ${
                    categoryId === cat.id ? 'bg-foreground text-background border-foreground' : 'hover:bg-muted'
                  }`}>{cat.nameAr || cat.name}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">{t('name')} *</label>
                <button onClick={autoEnhance} disabled={autoEnhancing || !form.name}
                  className="text-xs text-foreground hover:underline disabled:opacity-50">
                  {autoEnhancing ? t('loading') : 'AI - تحويل للعراقي'}
                </button>
              </div>
              <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                placeholder="مثال: بطانة فرامل أمامية" />
              {iraqiName && iraqiName !== form.name && (
                <p className="text-xs text-muted-foreground mt-1">العراقية: {iraqiName}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('partNumber')}</label>
              <input type="text" value={form.partNumber} onChange={(e) => setForm((p) => ({ ...p, partNumber: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none ltr text-left" placeholder="Part Number" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('brand')}</label>
              <input type="text" value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none" placeholder="Bosch, TRW..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('price')} (IQD) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none ltr text-left" placeholder="0" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('quantity')} *</label>
              <input type="number" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none ltr text-left" min="0" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('condition')}</label>
              <select value={form.condition} onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none bg-background">
                {Object.entries(CONDITION_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('status')}</label>
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none bg-background">
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('origin')}</label>
              <input type="text" value={form.origin} onChange={(e) => setForm((p) => ({ ...p, origin: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none" placeholder="GCC, Japanese..." />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t('notes')}</label>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2} className="w-full rounded-lg border px-3 py-2 text-sm outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t('image')} (URLs)</label>
            {imageUrls.map((url, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input type="url" value={url} onChange={(e) => updateImageUrl(index, e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none ltr text-left" />
                {url && (
                  <img src={url} alt="" className="h-10 w-10 rounded object-cover" />
                )}
                {imageUrls.length > 1 && (
                  <button onClick={() => removeImageUrl(index)} className="text-red-500 hover:underline text-sm">{t('remove')}</button>
                )}
              </div>
            ))}
            <button onClick={addImageUrl} className="text-sm text-foreground hover:underline">+ {t('add')}</button>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep('vehicle')} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">{t('back')}</button>
            <button onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">{t('cancel')}</button>
            <button onClick={handleSubmit} disabled={createPartMutation.isPending || createInventoryMutation.isPending || !form.name || !form.price}
              className="rounded-lg bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50">
              {(createPartMutation.isPending || createInventoryMutation.isPending) ? t('loading') : t('save')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
