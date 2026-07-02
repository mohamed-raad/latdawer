'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'

const TRIGGER_TYPES = [
  { value: 'part_added', labelAr: 'إضافة قطعة', icon: '🔧' },
  { value: 'price_changed', labelAr: 'تغيير السعر', icon: '💰' },
  { value: 'inventory_low', labelAr: 'مخزون قليل', icon: '📦' },
  { value: 'new_request', labelAr: 'طلب جديد', icon: '📝' },
  { value: 'schedule_daily', labelAr: 'جدولة يومية', icon: '⏰' },
  { value: 'schedule_weekly', labelAr: 'جدولة أسبوعية', icon: '📅' },
]

const ACTION_TYPES = [
  { value: 'rewrite_dialect', labelAr: 'تحويل للعراقي', icon: '🗣️' },
  { value: 'fetch_photos', labelAr: 'جلب الصور', icon: '🖼️' },
  { value: 'notify_store', labelAr: 'تنبيه المتجر', icon: '🔔' },
  { value: 'update_price', labelAr: 'تحديث السعر', icon: '💲' },
  { value: 'create_listing', labelAr: 'إنشاء إعلان', icon: '📢' },
  { value: 'send_whatsapp', labelAr: 'إرسال واتساب', icon: '💬' },
  { value: 'update_status', labelAr: 'تحديث الحالة', icon: '🔄' },
]

const PLAN_OPTIONS = [
  { value: 'free', labelAr: 'مجاني' },
  { value: 'basic', labelAr: 'أساسي' },
  { value: 'pro', labelAr: 'احترافي' },
  { value: 'enterprise', labelAr: 'مؤسسي' },
]

export default function AdminWorkflowsPage() {
  const { } = useLanguage()
  const [tab, setTab] = useState<'list' | 'create' | 'assign'>('list')
  const [workflowText, setWorkflowText] = useState('')
  const [manualForm, setManualForm] = useState({
    name: '',
    triggerType: 'part_added',
    actions: [] as string[],
  })
  const [assignForm, setAssignForm] = useState({
    storeId: '',
    workflowId: '',
    maxPricePerAction: '',
    maxActionsPerDay: '100',
    planRequired: 'free',
  })

  const { data: workflows, refetch: refetchWorkflows } = trpc.workflows.list.useQuery()
  const { data: stores } = trpc.stores.list.useQuery()

  const createFromTextMutation = trpc.workflows.createFromText.useMutation({
    onSuccess: () => { refetchWorkflows(); setTab('list'); setWorkflowText('') },
  })
  const createManualMutation = trpc.workflows.create.useMutation({
    onSuccess: () => { refetchWorkflows(); setTab('list'); setManualForm({ name: '', triggerType: 'part_added', actions: [] }) },
  })
  const deleteMutation = trpc.workflows.delete.useMutation({
    onSuccess: () => refetchWorkflows(),
  })
  const assignMutation = trpc.workflows.assignToStore.useMutation({
    onSuccess: () => { setTab('list'); setAssignForm({ storeId: '', workflowId: '', maxPricePerAction: '', maxActionsPerDay: '100', planRequired: 'free' }) },
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">أتمتة وسير العمل</h1>
      <p className="text-muted-foreground mb-6">أنشئ أتمتة بالنصوص أو يدوياً وعيّنها للمتاجر</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setTab('list')} className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${tab === 'list' ? 'bg-foreground text-background shadow-sm' : 'border hover:bg-muted'}`}>
          سير العمل ({workflows?.length || 0})
        </button>
        <button onClick={() => setTab('create')} className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${tab === 'create' ? 'bg-foreground text-background shadow-sm' : 'border hover:bg-muted'}`}>
          + إنشاء جديد
        </button>
        <button onClick={() => setTab('assign')} className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${tab === 'assign' ? 'bg-foreground text-background shadow-sm' : 'border hover:bg-muted'}`}>
          عيّنة للمتجر
        </button>
      </div>

      {/* Create Tab */}
      {tab === 'create' && (
        <div className="space-y-6">
          {/* Text-to-Workflow */}
          <div className="rounded-2xl border p-6">
            <h2 className="text-lg font-bold mb-2">إنشاء بالنصوص</h2>
            <p className="text-sm text-muted-foreground mb-4">اكتب ما تريد والأتمتة تنشأ تلقائياً</p>
            <textarea
              value={workflowText}
              onChange={(e) => setWorkflowText(e.target.value)}
              placeholder="مثال: عندما تُضاف قطعة جديدة، حوّل اسمها للعراقي وجلب لها صور من الانترنت"
              rows={4}
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
            />
            <div className="mt-3 flex gap-2">
              <button onClick={() => createFromTextMutation.mutate({ text: workflowText })}
                disabled={createFromTextMutation.isPending || !workflowText.trim()}
                className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background disabled:opacity-50 hover:opacity-90 transition-opacity">
                {createFromTextMutation.isPending ? 'جارٍ الإنشاء...' : 'إنشاء الأتمتة'}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <p className="text-xs text-muted-foreground w-full">أمثلة سريعة:</p>
              {[
                'عند إضافة قطعة، حوّل الاسم للعراقي وجلب صور',
                'عند تغيير السعر، أرسل تنبيه للمتجر عبر واتساب',
                'كل يوم، حدّث حالة المخزون المنخفض',
                'عند طلب جديد، أرسل تنبيه لجميع المتاجر القريبة',
              ].map((example) => (
                <button key={example} onClick={() => setWorkflowText(example)}
                  className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted transition-colors">
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Create */}
          <div className="rounded-2xl border p-6">
            <h2 className="text-lg font-bold mb-4">إنشاء يدوي</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">اسم الأتمتة</label>
                <input type="text" value={manualForm.name} onChange={(e) => setManualForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">المُشغّل</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TRIGGER_TYPES.map((trigger) => (
                    <button key={trigger.value} onClick={() => setManualForm((p) => ({ ...p, triggerType: trigger.value }))}
                      className={`rounded-xl border-2 p-3 text-right transition-all ${manualForm.triggerType === trigger.value ? 'border-foreground shadow-sm' : 'hover:border-foreground/30'}`}>
                      <span className="text-lg">{trigger.icon}</span>
                      <p className="text-sm font-medium mt-1">{trigger.labelAr}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">الإجراءات</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ACTION_TYPES.map((action) => {
                    const isSelected = manualForm.actions.includes(action.value)
                    return (
                      <button key={action.value}
                        onClick={() => setManualForm((p) => ({
                          ...p,
                          actions: isSelected
                            ? p.actions.filter((a) => a !== action.value)
                            : [...p.actions, action.value],
                        }))}
                        className={`rounded-xl border-2 p-3 text-right transition-all ${isSelected ? 'border-foreground bg-foreground/5 shadow-sm' : 'hover:border-foreground/30'}`}>
                        <span className="text-lg">{action.icon}</span>
                        <p className="text-sm font-medium mt-1">{action.labelAr}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
              <button onClick={() => createManualMutation.mutate({
                name: manualForm.name,
                triggerType: manualForm.triggerType,
                actions: manualForm.actions.map((a) => ({ type: a, config: {} })),
              })}
                disabled={createManualMutation.isPending || !manualForm.name || manualForm.actions.length === 0}
                className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background disabled:opacity-50 hover:opacity-90 transition-opacity">
                {createManualMutation.isPending ? 'جارٍ الإنشاء...' : 'إنشاء'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Tab */}
      {tab === 'assign' && (
        <div className="rounded-2xl border p-6 max-w-2xl">
          <h2 className="text-lg font-bold mb-4">عيّنة أتمتة لمتجر</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">المتجر</label>
              <select value={assignForm.storeId} onChange={(e) => setAssignForm((p) => ({ ...p, storeId: e.target.value }))}
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none bg-background">
                <option value="">اختر المتجر</option>
                {stores?.results?.map((s: { id: string; nameAr?: string; name: string }) => (
                  <option key={s.id} value={s.id}>{s.nameAr || s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الأتمتة</label>
              <select value={assignForm.workflowId} onChange={(e) => setAssignForm((p) => ({ ...p, workflowId: e.target.value }))}
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none bg-background">
                <option value="">اختر الأتمتة</option>
                {workflows?.map((w: { id: string; nameAr: string }) => (
                  <option key={w.id} value={w.id}>{w.nameAr}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">السعر الأقصى لكل إجراء (IQD)</label>
                <input type="number" value={assignForm.maxPricePerAction} onChange={(e) => setAssignForm((p) => ({ ...p, maxPricePerAction: e.target.value }))}
                  placeholder="0 = بدون حد" className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الحد الأقصى للإجراءات يومياً</label>
                <input type="number" value={assignForm.maxActionsPerDay} onChange={(e) => setAssignForm((p) => ({ ...p, maxActionsPerDay: e.target.value }))}
                  className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الخطة المطلوبة</label>
              <div className="flex gap-2">
                {PLAN_OPTIONS.map((plan) => (
                  <button key={plan.value} onClick={() => setAssignForm((p) => ({ ...p, planRequired: plan.value }))}
                    className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all ${assignForm.planRequired === plan.value ? 'border-foreground bg-foreground/5' : 'hover:border-foreground/30'}`}>
                    {plan.labelAr}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => assignMutation.mutate({
              storeId: assignForm.storeId,
              workflowId: assignForm.workflowId,
              maxPricePerAction: assignForm.maxPricePerAction ? Number(assignForm.maxPricePerAction) : undefined,
              maxActionsPerDay: assignForm.maxActionsPerDay ? Number(assignForm.maxActionsPerDay) : undefined,
              planRequired: assignForm.planRequired,
            })}
              disabled={assignMutation.isPending || !assignForm.storeId || !assignForm.workflowId}
              className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background disabled:opacity-50 hover:opacity-90 transition-opacity">
              {assignMutation.isPending ? 'جارٍ التعيين...' : 'تعيين'}
            </button>
          </div>
        </div>
      )}

      {/* List Tab */}
      {tab === 'list' && (
        <div className="space-y-3">
          {workflows && workflows.length > 0 ? (
            workflows.map((w: { id: string; nameAr: string; triggerType: string; enabled: boolean; createdAt: Date }) => {
              const trigger = TRIGGER_TYPES.find((t) => t.value === w.triggerType)
              return (
                <div key={w.id} className="rounded-2xl border p-4 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{trigger?.icon || '⚡'}</span>
                      <div>
                        <h3 className="font-bold">{w.nameAr}</h3>
                        <p className="text-xs text-muted-foreground">{trigger?.labelAr || w.triggerType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${w.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {w.enabled ? 'مفعّل' : 'معطّل'}
                      </span>
                      <button onClick={() => { setTab('assign'); setAssignForm((p) => ({ ...p, workflowId: w.id })) }}
                        className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted transition-colors">
                        عيّنة
                      </button>
                      <button onClick={() => deleteMutation.mutate({ id: w.id })}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors">
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-2xl border p-12 text-center">
              <p className="text-4xl mb-4">⚡</p>
              <p className="text-muted-foreground mb-4">ماكو أتمتة بعد</p>
              <button onClick={() => setTab('create')} className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background hover:opacity-90">
                + إنشاء أول أتمتة
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
