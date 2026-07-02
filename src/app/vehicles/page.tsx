'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { CONDITION_LABELS } from '@/constants'

const POPULAR_MAKES = ['تويوتا', 'نيسان', 'هيونداي', 'كيا']

const CONDITION_STYLES: Record<string, string> = {
  new: 'bg-green-100 text-green-700',
  used: 'bg-yellow-100 text-yellow-700',
  refurbished: 'bg-blue-100 text-blue-700',
  salvage: 'bg-red-100 text-red-700',
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
  )
}

function ConditionBadge({ condition }: { condition: string | null }) {
  if (!condition) return null
  const style = CONDITION_STYLES[condition] ?? 'bg-gray-100 text-gray-700'
  const label = CONDITION_LABELS[condition] ?? condition
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}

export default function VehiclesPage() {
  const [selectedMake, setSelectedMake] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  const { data: makes = [] } = trpc.vehicles.makes.useQuery()

  const { data: models = [], isLoading: modelsLoading } =
    trpc.vehicles.models.useQuery(
      { make: selectedMake },
      { enabled: !!selectedMake },
    )

  const { data: years = [], isLoading: yearsLoading } =
    trpc.vehicles.years.useQuery(
      { make: selectedMake, model: selectedModel },
      { enabled: !!selectedMake && !!selectedModel },
    )

  const { data: searchResults = [] } = trpc.vehicles.search.useQuery(
    { q: selectedMake },
    { enabled: !!selectedMake && !!selectedModel && !!selectedYear },
  )

  const matchedVehicle = useMemo(
    () =>
      searchResults.find(
        (v) => v.model === selectedModel && v.year === selectedYear,
      ),
    [searchResults, selectedModel, selectedYear],
  )

  const { data: partsData = [], isLoading: partsLoading } =
    trpc.vehicles.partsByVehicle.useQuery(
      { vehicleId: matchedVehicle?.id ?? '' },
      { enabled: !!matchedVehicle?.id },
    )

  const makeLabel = useMemo(
    () => makes.find((m) => m.make === selectedMake)?.makeAr ?? '',
    [makes, selectedMake],
  )
  const modelLabel = useMemo(
    () => models.find((m) => m.model === selectedModel)?.modelAr ?? '',
    [models, selectedModel],
  )

  const makeByAr = useMemo(
    () =>
      makes.reduce<Record<string, string>>((acc, m) => {
        acc[m.makeAr] = m.make
        return acc
      }, {}),
    [makes],
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">تصفح حسب المركبة</h1>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">ماركات شائعة:</span>
        {POPULAR_MAKES.map((ar) => {
          const eng = makeByAr[ar]
          if (!eng) return null
          return (
            <button
              key={eng}
              onClick={() => {
                setSelectedMake(eng)
                setSelectedModel('')
                setSelectedYear('')
              }}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                selectedMake === eng
                  ? 'bg-foreground text-background'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {ar}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-40 flex-1">
          <select
            value={selectedMake}
            onChange={(e) => {
              setSelectedMake(e.target.value)
              setSelectedModel('')
              setSelectedYear('')
            }}
            className="w-full appearance-none rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
          >
            <option value="">اختر الماركة</option>
            {makes.map((m) => (
              <option key={m.make} value={m.make}>
                {m.makeAr}
              </option>
            ))}
          </select>
        </div>

        <div className="relative min-w-40 flex-1">
          <select
            value={selectedModel}
            onChange={(e) => {
              setSelectedModel(e.target.value)
              setSelectedYear('')
            }}
            disabled={!selectedMake}
            className="w-full appearance-none rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-40"
          >
            <option value="">اختر الموديل</option>
            {models.map((m) => (
              <option key={m.model} value={m.model}>
                {m.modelAr}
              </option>
            ))}
          </select>
          {modelsLoading && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <Spinner />
            </span>
          )}
        </div>

        <div className="relative min-w-40 flex-1">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            disabled={!selectedModel}
            className="w-full appearance-none rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-40"
          >
            <option value="">اختر السنة</option>
            {years.map((y) => (
              <option key={y.year} value={y.year}>
                {y.year}
              </option>
            ))}
          </select>
          {yearsLoading && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <Spinner />
            </span>
          )}
        </div>
      </div>

      {matchedVehicle && (
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-bold">
              القطع المتوافقة مع {makeLabel} {modelLabel} {selectedYear}
            </h2>
            {partsLoading && <Spinner />}
          </div>

          {partsData.length === 0 && !partsLoading && (
            <p className="text-muted-foreground">
              لا توجد قطع متوافقة لهذه المركبة
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {partsData.map((item) => {
              const part = item.parts
              return (
                <Link
                  key={part.id}
                  href={`/parts/${part.id}`}
                  className="rounded-xl border p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold">{part.nameAr}</h3>
                    <ConditionBadge condition={part.condition} />
                  </div>
                  <p className="text-sm text-muted-foreground">{part.nameEn}</p>
                  {part.partNumber && (
                    <p className="mt-1 text-xs text-muted-foreground dir-ltr">
                      {part.partNumber}
                    </p>
                  )}
                  <span className="mt-2 inline-block text-sm text-primary">
                    اطلع على السعر
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
