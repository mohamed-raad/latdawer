'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'

type Step = 'manufacturers' | 'vehicles' | 'categories' | 'done'

export default function OnboardingPage() {
  const router = useRouter()
  const { } = useLanguage()
  const [step, setStep] = useState<Step>('manufacturers')
  const [saving, setSaving] = useState(false)

  const { data: manufacturers } = trpc.onboarding.getManufacturers.useQuery()
  const { data: categoriesData } = trpc.onboarding.getCategories.useQuery()
  const { data: existing } = trpc.onboarding.getStoreSpecializations.useQuery()

  const existingMfrs = existing?.manufacturers.map((m) => m.manufacturerId) || []
  const existingVehs = existing?.vehicles.map((v) => v.vehicleId) || []
  const existingCats = existing?.categories.map((c) => c.categoryId) || []

  const [selectedMfrs, setSelectedMfrs] = useState<string[]>(existingMfrs)
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>(existingVehs)
  const [selectedCats, setSelectedCats] = useState<string[]>(existingCats)

  const mfrsByCountry: Record<string, typeof manufacturers> = {}
  if (manufacturers) {
    for (const mfr of manufacturers) {
      const country = mfr.country || 'Other'
      if (!mfrsByCountry[country]) mfrsByCountry[country] = []
      mfrsByCountry[country].push(mfr)
    }
  }

  const mainCats = categoriesData?.filter((c) => !c.parentId) || []
  const subCatsMap: Record<string, typeof categoriesData> = {}
  if (categoriesData) {
    for (const cat of categoriesData) {
      if (cat.parentId) {
        if (!subCatsMap[cat.parentId]) subCatsMap[cat.parentId] = []
        subCatsMap[cat.parentId].push(cat)
      }
    }
  }

  const saveMfrs = trpc.onboarding.saveManufacturers.useMutation()
  const saveVehs = trpc.onboarding.saveVehicles.useMutation()
  const saveCats = trpc.onboarding.saveCategories.useMutation()

  function toggleMfr(id: string) {
    setSelectedMfrs((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }
  function toggleVehicle(id: string) {
    setSelectedVehicles((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }
  function toggleCat(id: string) {
    setSelectedCats((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function handleNext() {
    setSaving(true)
    try {
      if (step === 'manufacturers') {
        await saveMfrs.mutateAsync({ manufacturerIds: selectedMfrs })
        setStep('vehicles')
      } else if (step === 'vehicles') {
        await saveVehs.mutateAsync({ vehicleIds: selectedVehicles })
        setStep('categories')
      } else if (step === 'categories') {
        await saveCats.mutateAsync({ categories: selectedCats.map((catId) => ({ categoryId: catId })) })
        setStep('done')
      }
    } finally {
      setSaving(false)
    }
  }

  const steps = [
    { key: 'manufacturers', label: 'الشركات المصنعة', num: 1 },
    { key: 'vehicles', label: 'الطرازات', num: 2 },
    { key: 'categories', label: 'فئات القطع', num: 3 },
  ]
  const stepIndex = steps.findIndex((s) => s.key === step)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">إعداد المتجر</h1>
      <p className="text-sm text-muted-foreground mb-6">اختر الشركات والطرازات والقطع اللي تتعامل معها</p>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              stepIndex >= i ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
            }`}>{s.num}</div>
            <span className={`text-xs ${stepIndex >= i ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
            {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Manufacturers */}
      {step === 'manufacturers' && (
        <div>
          <h2 className="text-lg font-bold mb-4">اختر الشركات المصنعة</h2>
          <p className="text-sm text-muted-foreground mb-4">اضغط على الشركات اللي تبيع قطع غيار لها</p>
          {Object.entries(mfrsByCountry).map(([country, mfrs]) => (
            <div key={country} className="mb-6">
              <h3 className="font-medium text-sm mb-2 text-muted-foreground">{country}</h3>
              <div className="flex flex-wrap gap-2">
                {mfrs.map((mfr) => (
                  <button key={mfr.id} onClick={() => toggleMfr(mfr.id)}
                    className={`rounded-lg px-3 py-2 text-sm border transition-colors ${
                      selectedMfrs.includes(mfr.id) ? 'bg-foreground text-background border-foreground' : 'hover:bg-muted'
                    }`}>{mfr.nameAr || mfr.name}</button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground mt-4">اختار {selectedMfrs.length} شركة</p>
        </div>
      )}

      {/* Step 2: Vehicles */}
      {step === 'vehicles' && (
        <div>
          <h2 className="text-lg font-bold mb-4">اختر الطرازات</h2>
          <p className="text-sm text-muted-foreground mb-6">اختر الطرازات اللي تبيع قطع غيار لها</p>
          <VehiclePicker selectedMfrIds={selectedMfrs} selectedVehicles={selectedVehicles} onToggle={toggleVehicle} />
        </div>
      )}

      {/* Step 3: Categories */}
      {step === 'categories' && (
        <div>
          <h2 className="text-lg font-bold mb-4">اختر فئات القطع</h2>
          <p className="text-sm text-muted-foreground mb-4">اضغط على الفئات اللي توفرها في متجرك</p>
          <div className="space-y-4">
            {mainCats.map((cat) => {
              const subs = subCatsMap[cat.id] || []
              return (
                <div key={cat.id} className="rounded-xl border p-4">
                  <button onClick={() => toggleCat(cat.id)}
                    className={`w-full text-left font-bold text-sm mb-2 flex items-center gap-2 ${
                      selectedCats.includes(cat.id) ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                    <span className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${
                      selectedCats.includes(cat.id) ? 'bg-foreground text-background border-foreground' : 'border-border'
                    }`}>{selectedCats.includes(cat.id) && '✓'}</span>
                    {cat.nameAr || cat.name}
                  </button>
                  {subs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mr-7">
                      {subs.map((sub) => (
                        <button key={sub.id} onClick={() => toggleCat(sub.id)}
                          className={`rounded px-2 py-1 text-xs border transition-colors ${
                            selectedCats.includes(sub.id) ? 'bg-foreground text-background border-foreground' : 'hover:bg-muted'
                          }`}>{sub.nameAr || sub.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-4">اختار {selectedCats.length} فئة</p>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-bold mb-2">تم الإعداد بنجاح</h2>
          <p className="text-sm text-muted-foreground mb-6">
            اختار {selectedMfrs.length} شركة، {selectedVehicles.length} طراز، {selectedCats.length} فئة
          </p>
          <button onClick={() => router.push('/dashboard')} className="rounded-lg bg-foreground px-6 py-2.5 text-sm text-background hover:opacity-90">
            الذهاب للوحة التحكم
          </button>
        </div>
      )}

      {step !== 'done' && (
        <div className="flex justify-between mt-8">
          {stepIndex > 0 && (
            <button onClick={() => setStep(steps[stepIndex - 1].key as Step)} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">رجوع</button>
          )}
          <button onClick={handleNext} disabled={saving || (step === 'manufacturers' && selectedMfrs.length === 0)}
            className="rounded-lg bg-foreground px-6 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50 ml-auto">
            {saving ? 'جارٍ الحفظ...' : step === 'categories' ? 'إنهاء' : 'التالي'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Engine info parser ───
function parseEngineInfo(engine: string) {
  if (!engine) return { size: '', fuel: '', config: '' }

  // Extract size
  const sizeMatch = engine.match(/([\d.]+)L/i)
  const size = sizeMatch ? sizeMatch[1] + 'L' : ''

  // Detect fuel type
  let fuel = 'بنزين'
  if (/diesel|d-?max|turb[o]?\s*diesel|cdi|tdi|tci/i.test(engine)) fuel = 'ديزل'
  else if (/electric|ev|electricity/i.test(engine)) fuel = 'كهرباء'
  else if (/hybrid|hev|phev/i.test(engine)) fuel = 'هايبرد'
  else if (/cng|天然气/i.test(engine)) fuel = 'كاز'

  // Detect engine config
  let config = 'I4'
  if (/v6/i.test(engine)) config = 'V6'
  else if (/v8/i.test(engine)) config = 'V8'
  else if (/v10/i.test(engine)) config = 'V10'
  else if (/v12/i.test(engine)) config = 'V12'
  else if (/flat-?6|boxer/i.test(engine)) config = 'Flat-6'
  else if (/electric/i.test(engine)) config = ''

  return { size, fuel, config }
}

// ─── Vehicle Picker ───
function VehiclePicker({ selectedMfrIds, selectedVehicles, onToggle }: {
  selectedMfrIds: string[]
  selectedVehicles: string[]
  onToggle: (id: string) => void
}) {
  const { data: manufacturers } = trpc.onboarding.getManufacturers.useQuery()
  const [expandedMake, setExpandedMake] = useState<string | null>(null)
  const selectedMfrNames = manufacturers?.filter((m) => selectedMfrIds.includes(m.id)).map((m) => m.name) || []

  return (
    <div className="space-y-3">
      {selectedMfrNames.map((make) => (
        <VehicleMakeGroup key={make} make={make} selectedVehicles={selectedVehicles} onToggle={onToggle}
          expanded={expandedMake === make} onExpand={() => setExpandedMake(expandedMake === make ? null : make)} />
      ))}
    </div>
  )
}

// ─── Vehicle Make Group ───
function VehicleMakeGroup({ make, selectedVehicles, onToggle, expanded, onExpand }: {
  make: string
  selectedVehicles: string[]
  onToggle: (id: string) => void
  expanded: boolean
  onExpand: () => void
}) {
  const { data: vehicles } = trpc.onboarding.getVehiclesByMake.useQuery({ make })
  const count = vehicles?.filter((v) => selectedVehicles.includes(v.id)).length || 0

  // Group by model name
  const modelsMap: Record<string, typeof vehicles> = {}
  if (vehicles) {
    for (const v of vehicles) {
      const key = v.model
      if (!modelsMap[key]) modelsMap[key] = []
      modelsMap[key].push(v)
    }
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Header */}
      <button onClick={onExpand}
        className="w-full p-4 flex items-center justify-between text-sm hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-bold text-base">{make}</span>
          {count > 0 && <span className="text-xs bg-foreground text-background rounded-full px-2 py-0.5">{count}</span>}
        </div>
        <span className="text-muted-foreground text-xs">
          {Object.keys(modelsMap).length} موديل
        </span>
      </button>

      {/* Models */}
      {expanded && (
        <div className="border-t">
          {Object.entries(modelsMap).map(([modelName, modelVehicles]) => (
            <div key={modelName} className="border-b last:border-0">
              {/* Model name header */}
              <div className="px-4 pt-4 pb-2">
                <h4 className="font-bold text-sm text-foreground">{modelVehicles[0]?.modelAr || modelName}</h4>
              </div>
              {/* Vehicle cards for this model */}
              <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modelVehicles.map((v) => {
                  const info = parseEngineInfo(v.engine || '')
                  const isSelected = selectedVehicles.includes(v.id)
                  return (
                    <button key={v.id} onClick={() => onToggle(v.id)}
                      className={`relative text-right rounded-xl border-2 p-4 transition-all ${
                        isSelected
                          ? 'border-foreground bg-foreground/5 shadow-sm'
                          : 'border-border hover:border-foreground/30 hover:shadow-sm'
                      }`}>
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                          <span className="text-background text-xs">✓</span>
                        </div>
                      )}

                      {/* Year range */}
                      <p className="text-xs text-muted-foreground mb-2">{v.year}</p>

                      {/* Model name */}
                      <p className="font-bold text-base mb-3">{v.modelAr || v.model}</p>

                      {/* Info chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {info.size && (
                          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{info.size}</span>
                        )}
                        {info.config && (
                          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{info.config}</span>
                        )}
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{info.fuel}</span>
                        {v.trim && (
                          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{v.trim}</span>
                        )}
                      </div>

                      {/* Region */}
                      {v.origin && (
                        <p className="text-xs text-muted-foreground mt-2">{v.origin}</p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
