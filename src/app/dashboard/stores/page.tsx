'use client'

import { useState } from 'react'
import { useSession } from '@/hooks/use-session'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'
import { IRAQI_CITIES } from '@/constants'

interface FormState {
  name: string
  description: string
  city: string
  phone: string
  whatsapp: string
  address: string
  workingHours: string
  gpsLat: string
  gpsLng: string
}

function ViewField({ label, value, dir }: { label: string; value?: string | null; dir?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium" {...(dir ? { dir } : {})}>{value || '—'}</p>
    </div>
  )
}

function InputField({ label, value, onChange, rows, type }: { label: string; value: string; onChange: (v: string) => void; rows?: number; type?: string }) {
  const cls = 'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20'
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {rows ? (
        <textarea className={cls} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={cls} type={type || 'text'} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  )
}

export default function StorePage() {
  const { user } = useSession()
  const { t } = useLanguage()
  const isManager = user?.role === 'StoreManager' || user?.role === 'Admin'
  const { data: store, isLoading, refetch } = trpc.stores.myStore.useQuery(undefined, { enabled: isManager })
  const createMutation = trpc.stores.create.useMutation({ onSuccess: () => refetch() })
  const updateMutation = trpc.stores.update.useMutation({ onSuccess: () => { setEditing(false); refetch() } })

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [locating, setLocating] = useState(false)
  const [form, setForm] = useState<FormState>({
    name: '', description: '', city: '', phone: '', whatsapp: '', address: '', workingHours: '', gpsLat: '', gpsLng: '',
  })

  // Pre-fill from user profile when creating
  function startCreating() {
    setForm({
      name: '',
      description: '',
      city: user?.city || '',
      phone: user?.phone || '',
      whatsapp: user?.phone || '',
      address: '',
      workingHours: '',
      gpsLat: '',
      gpsLng: '',
    })
    setCreating(true)
  }

  function startEditing() {
    if (store) {
      setForm({
        name: store.name || '',
        description: store.description || '',
        city: store.city || user?.city || '',
        phone: store.phone || user?.phone || '',
        whatsapp: store.whatsapp || user?.phone || '',
        address: store.address || '',
        workingHours: store.workingHours || '',
        gpsLat: store.gpsLat || '',
        gpsLng: store.gpsLng || '',
      })
    }
    setEditing(true)
  }

  const update = (key: keyof FormState) => (v: string) => setForm((prev) => ({ ...prev, [key]: v }))

  function handleLocate() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          gpsLat: pos.coords.latitude.toFixed(6),
          gpsLng: pos.coords.longitude.toFixed(6),
        }))
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function handleCreate() {
    await createMutation.mutateAsync({
      name: form.name,
      city: form.city,
      description: form.description || undefined,
      phone: form.phone || undefined,
      whatsapp: form.whatsapp || undefined,
      address: form.address || undefined,
      workingHours: form.workingHours || undefined,
    })
    setCreating(false)
    setForm({ name: '', description: '', city: '', phone: '', whatsapp: '', address: '', workingHours: '', gpsLat: '', gpsLng: '' })
  }

  async function handleSave() {
    if (!store) return
    await updateMutation.mutateAsync({ id: store.id, ...form })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><p className="text-muted-foreground">{t('loading')}</p></div>
  }

  if (!store && !creating) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">{t('storeManagement')}</h1>
        <p className="mt-4 text-muted-foreground">{t('noStore')}</p>
        <button onClick={startCreating} className="mt-4 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90">
          {t('createStore')}
        </button>
      </div>
    )
  }

  if (creating) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t('createStore')}</h1>
        <div className="space-y-4">
          <InputField label={t('name')} value={form.name} onChange={update('name')} />
          <InputField label={t('description')} value={form.description} onChange={update('description')} rows={3} />

          <div>
            <label className="mb-1 block text-sm font-medium">{t('city')}</label>
            <select value={form.city} onChange={(e) => update('city')(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none bg-background">
              <option value="">{t('selectCity') || 'اختر المدينة'}</option>
              {IRAQI_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <InputField label={t('phone')} value={form.phone} onChange={update('phone')} type="tel" />
          <InputField label={t('whatsapp')} value={form.whatsapp} onChange={update('whatsapp')} type="tel" />

          <InputField label={t('address') || 'العنوان'} value={form.address} onChange={update('address')} />

          <div>
            <label className="mb-1 block text-sm font-medium">{t('address') || 'العنوان'} - الموقع الجغرافي</label>
            <div className="flex gap-2">
              <button type="button" onClick={handleLocate} disabled={locating}
                className="flex-1 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">
                {locating ? 'جارٍ التحديد...' : form.gpsLat ? 'تم التحديد ✓' : 'تحديد الموقع'}
              </button>
              {form.gpsLat && (
                <button type="button" onClick={() => setForm((p) => ({ ...p, gpsLat: '', gpsLng: '' }))}
                  className="rounded-lg border px-3 py-2 text-sm text-red-500 hover:bg-red-50">مسح</button>
              )}
            </div>
            {form.gpsLat && <p className="mt-1 text-xs text-muted-foreground ltr text-left">{form.gpsLat}, {form.gpsLng}</p>}
          </div>

          <InputField label={t('workingHours') || 'ساعات العمل'} value={form.workingHours} onChange={update('workingHours')} />

          {createMutation.isError && <p className="text-sm text-red-600">{t('error')}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={handleCreate} disabled={createMutation.isPending || !form.name || !form.city}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
              {createMutation.isPending ? t('loading') : t('save')}
            </button>
            <button onClick={() => setCreating(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">{t('cancel')}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t('store')}</h1>
      <p className="mt-1 text-muted-foreground">{t('storeManagement')}</p>

      <div className="mt-6 max-w-xl rounded-xl border p-6">
        {editing ? (
          <div className="space-y-4">
            <InputField label={t('name')} value={form.name} onChange={update('name')} />
            <InputField label={t('description')} value={form.description} onChange={update('description')} rows={3} />

            <div>
              <label className="mb-1 block text-sm font-medium">{t('city')}</label>
              <select value={form.city} onChange={(e) => update('city')(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none bg-background">
                {IRAQI_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <InputField label={t('phone')} value={form.phone} onChange={update('phone')} type="tel" />
            <InputField label={t('whatsapp')} value={form.whatsapp} onChange={update('whatsapp')} type="tel" />
            <InputField label={t('address') || 'العنوان'} value={form.address} onChange={update('address')} />

            <div>
              <label className="mb-1 block text-sm font-medium">الموقع الجغرافي</label>
              <div className="flex gap-2">
                <button type="button" onClick={handleLocate} disabled={locating}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">
                  {locating ? 'جارٍ التحديد...' : form.gpsLat ? 'تم التحديد ✓' : 'تحديد الموقع'}
                </button>
                {form.gpsLat && (
                  <button type="button" onClick={() => setForm((p) => ({ ...p, gpsLat: '', gpsLng: '' }))}
                    className="rounded-lg border px-3 py-2 text-sm text-red-500 hover:bg-red-50">مسح</button>
                )}
              </div>
              {form.gpsLat && <p className="mt-1 text-xs text-muted-foreground ltr text-left">{form.gpsLat}, {form.gpsLng}</p>}
            </div>

            <InputField label={t('workingHours') || 'ساعات العمل'} value={form.workingHours} onChange={update('workingHours')} />

            {updateMutation.isError && <p className="text-sm text-red-600">{t('error')}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={updateMutation.isPending} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
                {updateMutation.isPending ? t('loading') : t('save')}
              </button>
              <button onClick={() => setEditing(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">{t('cancel')}</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ViewField label={t('store')} value={store?.name} />
            <ViewField label={t('description')} value={store?.description} />
            <ViewField label={t('phone')} value={store?.phone} dir="ltr" />
            <ViewField label={t('whatsapp')} value={store?.whatsapp} dir="ltr" />
            <ViewField label={t('address') || 'العنوان'} value={store?.address} />
            <ViewField label={t('city')} value={store?.city} />
            <ViewField label={t('workingHours') || 'ساعات العمل'} value={store?.workingHours} />
            <button onClick={startEditing} className="mt-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">{t('edit')}</button>
          </div>
        )}
      </div>
    </div>
  )
}
