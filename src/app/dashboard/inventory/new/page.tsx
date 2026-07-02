'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { useSession } from '@/hooks/use-session'
import { PartSelector } from '@/components/part-selector'
import { ImageUpload } from '@/components/image-upload'
import { useLanguage } from '@/lib/i18n'

const CONDITION_OPTIONS = [
  { value: 'new', labelAr: 'جديد', labelEn: 'New' },
  { value: 'used', labelAr: 'مستعمل', labelEn: 'Used' },
  { value: 'refurbished', labelAr: 'مُجدد', labelEn: 'Refurbished' },
  { value: 'salvage', labelAr: 'تشليح', labelEn: 'Salvage' },
]

export default function NewInventoryPage() {
  const router = useRouter()
  const { user, loading: sessionLoading } = useSession()
  const { t, locale } = useLanguage()
  const { data: store } = trpc.stores.myStore.useQuery(undefined, { enabled: !!user })
  const utils = trpc.useUtils()

  const [partId, setPartId] = useState('')
  const [partName, setPartName] = useState('')
  const [partNumber, setPartNumber] = useState<string | null>(null)
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [condition, setCondition] = useState('new')
  const [installationPrice, setInstallationPrice] = useState('')
  const [notesAr, setNotesAr] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [error, setError] = useState('')

  const createMutation = trpc.inventory.create.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate()
      router.push('/dashboard/inventory')
    },
    onError: (e) => setError(e.message),
  })

  if (sessionLoading) return <div className="p-6 text-muted-foreground">{t('loading')}</div>
  if (!store) return <div className="p-6"><p className="text-muted-foreground">{t('noStore')}</p><Link href="/dashboard/stores" className="text-foreground underline">{t('createStore')}</Link></div>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!partId || !price || !store) { setError(t('required')); return }
    createMutation.mutate({
      partId,
      storeId: store.id,
      price: Number(price),
      currency: 'IQD',
      quantity: Number(quantity),
      condition: condition as 'new' | 'used' | 'refurbished' | 'salvage',
      installationPrice: installationPrice ? Number(installationPrice) : undefined,
      notesAr: notesAr || undefined,
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/inventory" className="text-sm text-muted-foreground hover:underline">&larr; {t('back')}</Link>
        <h1 className="text-2xl font-bold">{t('add')} {t('inventory')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <PartSelector value={partId} onChange={(id, name, num) => { setPartId(id); setPartName(name); setPartNumber(num) }} />

        {partId && (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p><strong>{partName}</strong> <span dir="ltr" className="text-muted-foreground">({partNumber})</span></p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t('price')} (IQD) *</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full rounded-lg border px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t('installationPrice')}</label>
            <input type="number" value={installationPrice} onChange={(e) => setInstallationPrice(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t('quantity')} *</label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="0" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t('condition')}</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none">
              {CONDITION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{locale === 'ar' ? o.labelAr : o.labelEn}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t('notes') || 'ملاحظات'}</label>
          <textarea value={notesAr} onChange={(e) => setNotesAr(e.target.value)} rows={3} className="w-full rounded-lg border px-3 py-2 text-sm outline-none" />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-2">{t('image') || 'صور القطعة'}</label>
          <ImageUpload images={images} onChange={setImages} />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background disabled:opacity-50">
            {createMutation.isPending ? t('loading') : t('save')}
          </button>
          <Link href="/dashboard/inventory" className="rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors">{t('cancel')}</Link>
        </div>
      </form>
    </div>
  )
}
