'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'

const PERMISSION_OPTIONS = [
  { value: 'read', label: 'قراءة', desc: 'البحث والاطلاع على البيانات' },
  { value: 'write', label: 'كتابة', desc: 'إضافة وتعديل البيانات' },
  { value: 'admin', label: 'إدارة', desc: 'صلاحيات كاملة' },
  { value: 'store_management', label: 'إدارة المتاجر', desc: 'قبول ورفض المتاجر' },
  { value: 'ads_control', label: 'إدارة الإعلانات', desc: 'إنشاء وتعديل الإعلانات' },
  { value: 'ai_control', label: 'التحكم بالذكاء الاصطناعي', desc: 'الاطلاع على المزودين والنماذج' },
]

export default function AgentAdminPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [newAgent, setNewAgent] = useState({ name: '', description: '', permissions: 'read' })
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['read'])

  const { data: agents, refetch } = trpc.agent.listAgents.useQuery()
  const createMutation = trpc.agent.createAgent.useMutation({
    onSuccess: () => { refetch(); setShowCreate(false); setNewAgent({ name: '', description: '', permissions: 'read' }) }
  })
  const deleteMutation = trpc.agent.deleteAgent.useMutation({ onSuccess: () => refetch() })

  const handleCreate = () => {
    createMutation.mutate({
      name: newAgent.name,
      description: newAgent.description,
      permissions: selectedPermissions.join(','),
    })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">إدارة وكلاء الذكاء الاصطناعي</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-foreground px-4 py-2 text-sm text-background"
        >
          + إضافة وكيل
        </button>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        أنشئ مفاتيح API للوكلاء الذكاء الاصطناعي للتحكم بالتطبيق
      </p>

      {/* Create Agent Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-background p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">إضافة وكيل جديد</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">اسم الوكيل</label>
                <input
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="مثال: Hermes Bot"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">الوصف</label>
                <input
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="وصف الوكيل"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الصلاحيات</label>
                <div className="space-y-2">
                  {PERMISSION_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(opt.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, opt.value])
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(p => p !== opt.value))
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <div>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreate}
                disabled={!newAgent.name || createMutation.isPending}
                className="rounded-lg bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
              >
                {createMutation.isPending ? '...' : 'إنشاء'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agents List */}
      <div className="rounded-xl border">
        <div className="p-4 border-b">
          <h3 className="font-bold">الوكلاء المسجلين</h3>
        </div>
        {agents && agents.length > 0 ? (
          <div className="divide-y">
            {agents.map((agent: { id: string; name: string; slug: string; enabled: boolean; permissions: string; rateLimit: number; description?: string; apiKey?: string; lastUsedAt?: Date | null }) => (
              <div key={agent.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold">{agent.name}</p>
                    {agent.description && <p className="text-xs text-muted-foreground">{agent.description}</p>}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {agent.permissions.split(',').map((p) => (
                        <span key={p} className="rounded bg-muted px-2 py-0.5 text-xs">
                          {PERMISSION_OPTIONS.find(o => o.value === p.trim())?.label || p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${agent.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {agent.enabled ? 'مفعّل' : 'معطّل'}
                    </span>
                    <button
                      onClick={() => deleteMutation.mutate({ id: agent.id })}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      حذف
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-1">مفتاح API:</p>
                  <code className="text-xs break-all" dir="ltr">{agent.apiKey}</code>
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>الحد: {agent.rateLimit} طلب/دقيقة</span>
                  {agent.lastUsedAt && <span>آخر استخدام: {new Date(agent.lastUsedAt).toLocaleDateString('ar-IQ')}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            لا توجد وكلاء مسجلين
          </div>
        )}
      </div>

      {/* API Documentation */}
      <div className="mt-6 rounded-xl border p-6">
        <h3 className="font-bold mb-4">توثيق API</h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium mb-1">البحث عن القطع:</p>
            <code className="block bg-muted p-2 rounded text-xs" dir="ltr">
              POST /api/trpc/agent.agentSearch<br/>
              {'{ "apiKey": "cpa_xxx", "query": "بكرة دينمو" }'}
            </code>
          </div>
          <div>
            <p className="font-medium mb-1">قبول متجر:</p>
            <code className="block bg-muted p-2 rounded text-xs" dir="ltr">
              POST /api/trpc/agent.agentVerifyStore<br/>
              {'{ "apiKey": "cpa_xxx", "storeId": "xxx" }'}
            </code>
          </div>
          <div>
            <p className="font-medium mb-1">رفض متجر:</p>
            <code className="block bg-muted p-2 rounded text-xs" dir="ltr">
              POST /api/trpc/agent.agentRejectStore<br/>
              {'{ "apiKey": "cpa_xxx", "storeId": "xxx", "reason": "..." }'}
            </code>
          </div>
          <div>
            <p className="font-medium mb-1">إنشاء إعلان:</p>
            <code className="block bg-muted p-2 rounded text-xs" dir="ltr">
              POST /api/trpc/agent.agentCreateAd<br/>
              {'{ "apiKey": "cpa_xxx", "storeId": "xxx", "title": "...", "budget": 10000, ... }'}
            </code>
          </div>
          <div>
            <p className="font-medium mb-1">التحكم بالذكاء الاصطناعي:</p>
            <code className="block bg-muted p-2 rounded text-xs" dir="ltr">
              GET /api/trpc/agent.agent控制AI?input=JSON
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}