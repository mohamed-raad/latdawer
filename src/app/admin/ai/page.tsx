'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'

const PRESET_PROVIDERS = [
  {
    name: 'GroqCloud',
    slug: 'groq',
    apiEndpoint: 'https://api.groq.com/openai/v1',
    envKey: 'GROQ_API_KEY',
  },
  {
    name: 'Google Gemini',
    slug: 'gemini',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
    envKey: 'GOOGLE_AI_API_KEY',
  },
  {
    name: 'Mistral AI',
    slug: 'mistral',
    apiEndpoint: 'https://api.mistral.ai/v1',
    envKey: 'MISTRAL_API_KEY',
  },
  {
    name: 'NVIDIA NIM',
    slug: 'nvidia-nim',
    apiEndpoint: 'https://integrate.api.nvidia.com/v1',
    envKey: 'NVIDIA_NIM_API_KEY',
  },
]

export default function AIAdminPage() {
  const [tab, setTab] = useState<'providers' | 'models' | 'ads' | 'knowledge'>('providers')
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null)
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [fetchStatus, setFetchStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({})

  const { data: providers, refetch: refetchProviders } = trpc.ai.listProviders.useQuery()
  const { data: models, refetch: refetchModels } = trpc.ai.listModels.useQuery({})
  const { data: knowledge, refetch: refetchKnowledge } = trpc.ai.getKnowledgeBase.useQuery()
  const { data: stores } = trpc.stores.list.useQuery()
  const { data: ads } = trpc.features.listActiveAds.useQuery({})

  const createProviderMutation = trpc.ai.createProvider.useMutation({ onSuccess: () => refetchProviders() })
  const updateProviderMutation = trpc.ai.updateProvider.useMutation({ onSuccess: () => refetchProviders() })
  const deleteProviderMutation = trpc.ai.deleteProvider.useMutation({ onSuccess: () => { refetchProviders(); refetchModels() } })
  const createModelMutation = trpc.ai.createModel.useMutation({ onSuccess: () => refetchModels() })
  const updateModelMutation = trpc.ai.updateModel.useMutation({ onSuccess: () => refetchModels() })
  const deleteModelMutation = trpc.ai.deleteModel.useMutation({ onSuccess: () => refetchModels() })
  const addKnowledgeMutation = trpc.ai.addKnowledge.useMutation({ onSuccess: () => refetchKnowledge() })
  const fetchModelsMutation = trpc.ai.fetchModels.useMutation()

  const handleAddPresetProvider = async (preset: typeof PRESET_PROVIDERS[0]) => {
    const apiKey = apiKeyInputs[preset.slug] || ''
    await createProviderMutation.mutateAsync({
      name: preset.name,
      slug: preset.slug,
      apiEndpoint: preset.apiEndpoint,
      apiKey: apiKey || undefined,
    })
    setApiKeyInputs((prev) => ({ ...prev, [preset.slug]: '' }))
  }

  const handleFetchModels = async (providerId: string, _slug: string) => {
    setFetchStatus((prev) => ({ ...prev, [providerId]: 'loading' }))
    try {
      const result = await fetchModelsMutation.mutateAsync({ providerId })
      if (result.models) {
        for (const model of result.models) {
          await createModelMutation.mutateAsync({
            providerId,
            modelId: model.id,
            name: model.name,
          })
        }
        await refetchModels()
        setFetchStatus((prev) => ({ ...prev, [providerId]: 'success' }))
      }
    } catch {
      setFetchStatus((prev) => ({ ...prev, [providerId]: 'error' }))
    }
  }

  const handleToggleModel = async (modelId: string, currentEnabled: boolean) => {
    await updateModelMutation.mutateAsync({
      id: modelId,
      enabled: !currentEnabled,
    })
  }

  const handleToggleProvider = async (providerId: string, currentEnabled: boolean) => {
    await updateProviderMutation.mutateAsync({
      id: providerId,
      enabled: !currentEnabled,
    })
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">إدارة المساعد الذكي</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setTab('providers')} className={`rounded-lg px-4 py-2 text-sm ${tab === 'providers' ? 'bg-foreground text-background' : 'border'}`}>المزودين والنماذج</button>
        <button onClick={() => setTab('ads')} className={`rounded-lg px-4 py-2 text-sm ${tab === 'ads' ? 'bg-foreground text-background' : 'border'}`}>الإعلانات</button>
        <button onClick={() => setTab('knowledge')} className={`rounded-lg px-4 py-2 text-sm ${tab === 'knowledge' ? 'bg-foreground text-background' : 'border'}`}>قاعدة المعرفة</button>
      </div>

      {tab === 'providers' && (
        <div className="space-y-6">
          {/* Preset Providers */}
          <div className="rounded-xl border p-4">
            <h3 className="font-bold mb-3">إضافة مزود بالضغط الواحد</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRESET_PROVIDERS.map((preset) => {
                const exists = providers?.some((p) => p.slug === preset.slug)
                const provider = providers?.find((p) => p.slug === preset.slug)
                const providerModels = models?.filter((m: { providerId: string; id: string; name: string; enabled: boolean }) => m.providerId === provider?.id) || []

                return (
                  <div key={preset.slug} className={`rounded-lg border p-4 ${exists ? 'bg-green-50/50' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-sm">{preset.name}</p>
                        <p className="text-xs text-muted-foreground">{providerModels.length} نموذج مُضاف</p>
                      </div>
                      {exists ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">مضاف</span>
                          <button
                            onClick={() => provider && handleToggleProvider(provider.id, provider.enabled)}
                            className={`text-xs px-2 py-1 rounded ${provider?.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                          >
                            {provider?.enabled ? 'مفعّل' : 'معطّل'}
                          </button>
                          <button onClick={() => provider && deleteProviderMutation.mutate({ id: provider.id })} className="text-xs text-red-500 hover:text-red-700">حذف</button>
                        </div>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-muted">غير مضاف</span>
                      )}
                    </div>

                    {!exists && (
                      <div className="mt-3 space-y-2">
                        <div className="relative">
                          <input
                            type={showKeys[preset.slug] ? 'text' : 'password'}
                            placeholder={`مفتاح ${preset.envKey}`}
                            className="w-full rounded-lg border px-3 py-2 text-sm pr-20"
                            value={apiKeyInputs[preset.slug] || ''}
                            onChange={(e) => setApiKeyInputs((prev) => ({ ...prev, [preset.slug]: e.target.value }))}
                          />
                          <button
                            onClick={() => setShowKeys((prev) => ({ ...prev, [preset.slug]: !prev[preset.slug] }))}
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            {showKeys[preset.slug] ? 'إخفاء' : 'إظهار'}
                          </button>
                        </div>
                        <button
                          onClick={() => handleAddPresetProvider(preset)}
                          disabled={createProviderMutation.isPending}
                          className="w-full rounded-lg bg-foreground px-4 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50"
                        >
                          {createProviderMutation.isPending ? 'جارٍ الإضافة...' : 'إضافة المزود'}
                        </button>
                      </div>
                    )}

                    {exists && provider && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => handleFetchModels(provider.id, preset.slug)}
                            disabled={fetchStatus[provider.id] === 'loading'}
                            className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
                          >
                            {fetchStatus[provider.id] === 'loading' ? 'جارٍ التحديث...' : fetchStatus[provider.id] === 'success' ? '✓ تم التحديث' : 'جلب النماذج من المزود'}
                          </button>
                          {fetchStatus[provider.id] === 'error' && (
                            <span className="text-xs text-red-500">فشل الجلب - تحقق من المفتاح</span>
                          )}
                        </div>
                        <button
                          onClick={() => setExpandedProvider(expandedProvider === provider.id ? null : provider.id)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          {expandedProvider === provider.id ? 'إخفاء النماذج' : `عرض ${providerModels.length} نموذج`}
                        </button>
                      </div>
                    )}

                    {exists && expandedProvider === provider?.id && providerModels.length > 0 && (
                      <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
                        {providerModels.map((m: { id: string; name: string; enabled: boolean }) => (
                          <div key={m.id} className="flex items-center justify-between rounded bg-muted/50 px-3 py-1.5 text-xs">
                            <span className="truncate">{m.name}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleToggleModel(m.id, m.enabled)}
                                className={`px-2 py-0.5 rounded text-xs ${m.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                              >
                                {m.enabled ? 'مفعّل' : 'معطّل'}
                              </button>
                              <button onClick={() => deleteModelMutation.mutate({ id: m.id })} className="text-red-400 hover:text-red-600">×</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Custom Provider */}
          <div className="rounded-xl border p-4">
            <h3 className="font-bold mb-3">إضافة مزود مخصص</h3>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="الاسم" className="rounded-lg border px-3 py-2 text-sm" id="prov-name" />
              <input placeholder="المعرف (slug)" className="rounded-lg border px-3 py-2 text-sm" id="prov-slug" />
              <input placeholder="رابط API" className="rounded-lg border px-3 py-2 text-sm" id="prov-endpoint" />
              <input placeholder="مفتاح API" type="password" className="rounded-lg border px-3 py-2 text-sm" id="prov-key" />
            </div>
            <button
              onClick={() => {
                const name = (document.getElementById('prov-name') as HTMLInputElement).value
                const slug = (document.getElementById('prov-slug') as HTMLInputElement).value
                const apiEndpoint = (document.getElementById('prov-endpoint') as HTMLInputElement).value
                const apiKey = (document.getElementById('prov-key') as HTMLInputElement).value
                if (name && slug && apiEndpoint) {
                  createProviderMutation.mutate({ name, slug, apiEndpoint, apiKey })
                }
              }}
              className="mt-3 rounded-lg bg-foreground px-4 py-2 text-sm text-background"
            >
              إضافة
            </button>
          </div>
        </div>
      )}

      {tab === 'ads' && (
        <div className="space-y-6">
          <div className="rounded-xl border p-4">
            <h3 className="font-bold mb-3">إدارة الإعلانات</h3>
            <p className="text-sm text-muted-foreground mb-4">إدارة إعلانات المتاجر التي تظهر في نتائج البحث</p>
            {ads && ads.length > 0 ? (
              <div className="space-y-2">
                {ads.map((ad: { id: string; titleAr: string; storeId: string; impressions: number; clicks: number; budget: number }) => {
                  const store = stores?.results?.find((s: { id: string; nameAr?: string }) => s.id === ad.storeId)
                  return (
                    <div key={ad.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-sm">{ad.titleAr}</p>
                        <p className="text-xs text-muted-foreground">{store?.nameAr || 'متجر'}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>👁 {ad.impressions}</span>
                        <span>👆 {ad.clicks}</span>
                        <span>{ad.budget.toLocaleString()} د.ع</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لا توجد إعلانات حالياً</p>
            )}
          </div>
        </div>
      )}

      {tab === 'knowledge' && (
        <div className="space-y-6">
          <div className="rounded-xl border p-4">
            <h3 className="font-bold mb-3">إضافة مصطلح</h3>
            <div className="grid grid-cols-3 gap-3">
              <input placeholder="المصطلح (عراقي)" className="rounded-lg border px-3 py-2 text-sm" id="kb-term" />
              <input placeholder="المعنى (عربي)" className="rounded-lg border px-3 py-2 text-sm" id="kb-translation" />
              <input placeholder="الفئة" className="rounded-lg border px-3 py-2 text-sm" id="kb-category" />
            </div>
            <button
              onClick={() => {
                const term = (document.getElementById('kb-term') as HTMLInputElement).value
                const translation = (document.getElementById('kb-translation') as HTMLInputElement).value
                const category = (document.getElementById('kb-category') as HTMLInputElement).value
                if (term && translation) {
                  addKnowledgeMutation.mutate({ term, translation, category })
                }
              }}
              className="mt-3 rounded-lg bg-foreground px-4 py-2 text-sm text-background"
            >
              إضافة
            </button>
          </div>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-right">المصطلح</th>
                  <th className="p-3 text-right">المعنى</th>
                  <th className="p-3 text-right">الفئة</th>
                </tr>
              </thead>
              <tbody>
                {knowledge?.map((k: { id: string; term: string; translation: string; category: string }) => (
                  <tr key={k.id} className="border-b">
                    <td className="p-3">{k.term}</td>
                    <td className="p-3">{k.translation}</td>
                    <td className="p-3">{k.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
