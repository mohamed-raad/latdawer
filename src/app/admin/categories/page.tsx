'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'

export default function CategoriesPage() {
  const { t } = useLanguage()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', nameAr: '', slug: '' })
  
  const { data: categories, refetch } = trpc.admin.listCategories.useQuery()
  const createMutation = trpc.admin.createCategory.useMutation({ onSuccess: () => refetch() })
  const updateMutation = trpc.admin.updateCategory.useMutation({ onSuccess: () => refetch() })
  const deleteMutation = trpc.admin.deleteCategory.useMutation({ onSuccess: () => refetch() })
  
  const handleSubmit = async () => {
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...formData })
    } else {
      await createMutation.mutateAsync(formData)
    }
    setEditingId(null)
    setFormData({ name: '', nameAr: '', slug: '' })
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('categories')}</h1>
      
      {/* Form */}
      <div className="mb-6 rounded-xl border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            placeholder={t('categoryNameAr')}
            value={formData.nameAr}
            onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
            className="rounded-lg border px-3 py-2"
          />
          <input
            placeholder={t('categoryNameEn')}
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
              <th className="p-3 text-right">{t('categoryNameAr')}</th>
              <th className="p-3 text-right">{t('categoryNameEn')}</th>
              <th className="p-3 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {categories?.map((cat: { id: string; nameAr: string; name: string; slug: string }) => (
              <tr key={cat.id} className="border-b">
                <td className="p-3">{cat.nameAr}</td>
                <td className="p-3">{cat.name}</td>
                <td className="p-3">
                  <button
                    onClick={() => {
                      setEditingId(cat.id)
                      setFormData({ name: cat.name, nameAr: cat.nameAr, slug: cat.slug })
                    }}
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate({ id: cat.id })}
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