'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { ImageUpload } from '@/components/image-upload'
import { useLanguage } from '@/lib/i18n'

const CONDITION_OPTIONS = [
  { value: 'new', labelAr: 'جديد', labelEn: 'New' },
  { value: 'used', labelAr: 'مستعمل', labelEn: 'Used' },
  { value: 'refurbished', labelAr: 'مُجدد', labelEn: 'Refurbished' },
  { value: 'salvage', labelAr: 'تشليح', labelEn: 'Salvage' },
]

export default function EditInventoryPage() {
  const router = useRouter()
  const params = useParams()
  const { t, locale } = useLanguage()
  const utils = trpc.useUtils()

  const { data: item, isLoading } = trpc.inventory.byId.useQuery({ id: params.id as string })
  const initialized = useRef(false)

  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('IQD')
  const [quantity, setQuantity] = useState('')
  const [condition, setCondition] = useState('new')
  const [installationPrice, setInstallationPrice] = useState('')
  const [notesAr, setNotesAr] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (item && !initialized.current) {
      initialized.current = true
      setPrice(String(item.inventory.price))
      setCurrency(item.inventory.currency)
      setQuantity(String(item.inventory.quantity))
      setCondition(item.inventory.condition)
      setInstallationPrice(item.inventory.installationPrice ? String(item.inventory.installationPrice) : '')
      setNotesAr(item.inventory.notesAr || '')
    }
  }, [item])

  const updateMutation = trpc.inventory.update.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate()
      router.push('/dashboard/inventory')
    },
    onError: (e) => setError(e.message),
  })

  const deleteMutation = trpc.inventory.delete.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate()
      router.push('/dashboard/inventory')
    },
    onError: (e) => setError(e.message),
  })

  if (isLoading) return <div className="p-6 text-muted-foreground">{t('loading')}</div>
  if (!item) return <div className="p-6 text-muted-foreground">{t('notFound')}</div>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!item) return
    updateMutation.mutate({
      id: item.inventory.id,
      price: Number(price),
      currency,
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
        <h1 className="text-2xl font-bold">{t('edit')} {t('inventory')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-lg bg-muted p-3 text-sm">
          <p><strong>{item.parts?.nameAr}</strong> <span dir="ltr" className="text-muted-foreground">({item.parts?.partNumber})</span></p>
        </div>

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
          <button type="submit" disabled={updateMutation.isPending} className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background disabled:opacity-50">
            {updateMutation.isPending ? t('loading') : t('save')}
          </button>
          <button type="button" onClick={() => { if (confirm(t('confirmDelete') || 'تأكيد الحذف؟')) deleteMutation.mutate({ id: item.inventory.id }) }} disabled={deleteMutation.isPending} className="rounded-lg border border-red-300 px-6 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            {t('delete')}
          </button>
          <Link href="/dashboard/inventory" className="rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors">{t('cancel')}</Link>
        </div>
      </form>
    </div>
  )
}
