'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'

export default function ManufacturersPage() {
  const { t } = useLanguage()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', nameAr: '', slug: '', country: '' })
  
  const { data: manufacturers, refetch } = trpc.admin.listManufacturers.useQuery()
  const createMutation = trpc.admin.createManufacturer.useMutation({ onSuccess: () => refetch() })
  const updateMutation = trpc.admin.updateManufacturer.useMutation({ onSuccess: () => refetch() })
  const deleteMutation = trpc.admin.deleteManufacturer.useMutation({ onSuccess: () => refetch() })
  
  const handleSubmit = async () => {
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...formData })
    } else {
      await createMutation.mutateAsync(formData)
    }
    setEditingId(null)
    setFormData({ name: '', nameAr: '', slug: '', country: '' })
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('manufacturers')}</h1>
      
      {/* Form */}
      <div className="mb-6 rounded-xl border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            placeholder={t('manufacturerNameAr')}
            value={formData.nameAr}
            onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
            className="rounded-lg border px-3 py-2"
          />
          <input
            placeholder={t('manufacturerNameEn')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="rounded-lg border px-3 py-2"
          />
          <input
            placeholder={t('slug')}
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="rounded-lg border px-3 py-2"
          />
          <input
            placeholder={t('country')}
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="rounded-lg border px-3 py-2"
          />
        </div>
        <button
          onClick={handleSubmit}
          className="mt-4 rounded-lg bg-foreground px-4 py-2 text-sm text-background"
        >
          {editingId ? t('update') : t('create')}
        </button>
      </div>
      
      {/* List */}
      <div className="rounded-xl border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-right">{t('manufacturerNameAr')}</th>
              <th className="p-3 text-right">{t('manufacturerNameEn')}</th>
              <th className="p-3 text-right">{t('country')}</th>
              <th className="p-3 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {manufacturers?.map((man: { id: string; nameAr: string; name: string; country: string }) => (
              <tr key={man.id} className="border-b">
                <td className="p-3">{man.nameAr}</td>
                <td className="p-3">{man.name}</td>
                <td className="p-3">{man.country}</td>
                <td className="p-3">
                  <button
                    onClick={() => {
                      setEditingId(man.id)
                      setFormData({ name: man.name, nameAr: man.nameAr, slug: man.slug, country: man.country || '' })
                    }}
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate({ id: man.id })}
                    className="text-red-600 hover:underline"
                  >
                    {t('delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}