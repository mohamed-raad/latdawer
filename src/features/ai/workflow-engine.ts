import { db } from '@/db'
import { workflows, workflowRuns, storeAutomations, stores, subscriptions, inventory, notifications, aiProviders } from '@/db/schema'
import { eq, and, gte, count } from 'drizzle-orm'
import { rewriteToIraqiDialect } from './iraqi-dialect'
import { autoFetchPartPhotos } from './photo-fetch'

const PLAN_HIERARCHY: Record<string, number> = { free: 0, basic: 1, pro: 2, enterprise: 3 }

export type TriggerType =
  | 'part_added'
  | 'price_changed'
  | 'inventory_low'
  | 'new_request'
  | 'store_verified'
  | 'schedule_daily'
  | 'schedule_weekly'

export interface WorkflowAction {
  type: 'rewrite_dialect' | 'fetch_photos' | 'notify_store' | 'update_price' | 'create_listing' | 'send_whatsapp' | 'update_status'
  config: Record<string, unknown>
}

export interface WorkflowCondition {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in'
  value: unknown
}

export interface WorkflowDefinition {
  name: string
  triggerType: TriggerType
  triggerConfig?: Record<string, unknown>
  actions: WorkflowAction[]
  conditions?: WorkflowCondition[]
}

export async function createWorkflow(data: WorkflowDefinition, createdBy: string) {
  const [workflow] = await db.insert(workflows).values({
    id: crypto.randomUUID(),
    name: data.name,
    nameAr: await rewriteToIraqiDialect(data.name),
    triggerType: data.triggerType,
    triggerConfig: JSON.stringify(data.triggerConfig || {}),
    actions: JSON.stringify(data.actions),
    conditions: JSON.stringify(data.conditions || []),
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()
  return workflow
}

export async function listWorkflows() {
  return db.select().from(workflows).where(eq(workflows.enabled, true))
}

export async function getWorkflowById(id: string) {
  const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id))
  return workflow
}

export async function updateWorkflow(id: string, data: Partial<WorkflowDefinition>) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (data.name) updateData.name = data.name
  if (data.name) updateData.nameAr = await rewriteToIraqiDialect(data.name)
  if (data.triggerType) updateData.triggerType = data.triggerType
  if (data.triggerConfig) updateData.triggerConfig = JSON.stringify(data.triggerConfig)
  if (data.actions) updateData.actions = JSON.stringify(data.actions)
  if (data.conditions) updateData.conditions = JSON.stringify(data.conditions)

  const [workflow] = await db.update(workflows).set(updateData).where(eq(workflows.id, id)).returning()
  return workflow
}

export async function deleteWorkflow(id: string) {
  await db.delete(workflows).where(eq(workflows.id, id))
}

export async function runWorkflow(workflowId: string, input: Record<string, unknown>, storeId?: string) {
  const [run] = await db.insert(workflowRuns).values({
    id: crypto.randomUUID(),
    workflowId,
    storeId: storeId || null,
    status: 'running',
    input: JSON.stringify(input),
    startedAt: new Date(),
  }).returning()

  try {
    const workflow = await getWorkflowById(workflowId)
    if (!workflow) throw new Error('Workflow not found')

    const actions = JSON.parse(workflow.actions) as WorkflowAction[]
    const results: unknown[] = []

    for (const action of actions) {
      const result = await executeAction(action, input, storeId)
      results.push(result)
    }

    await db.update(workflowRuns).set({
      status: 'completed',
      output: JSON.stringify(results),
      completedAt: new Date(),
    }).where(eq(workflowRuns.id, run.id))

    return { success: true, runId: run.id, results }
  } catch (error) {
    await db.update(workflowRuns).set({
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      completedAt: new Date(),
    }).where(eq(workflowRuns.id, run.id))

    return { success: false, runId: run.id, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function executeAction(action: WorkflowAction, input: Record<string, unknown>, storeId?: string) {
  switch (action.type) {
    case 'rewrite_dialect':
      return rewriteToIraqiDialect(input.text as string || '')

    case 'fetch_photos':
      return autoFetchPartPhotos(
        input.partName as string || '',
        input.partNumber as string || null,
        input.make as string || '',
        input.model as string || '',
        input.year as string || ''
      )

    case 'notify_store': {
      if (!storeId) return { notified: false, reason: 'No storeId' }
      const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1)
      if (!store) return { notified: false, reason: 'Store not found' }
      const [owner] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1)
      if (owner?.ownerId) {
        await db.insert(notifications).values({
          id: crypto.randomUUID(),
          userId: owner.ownerId,
          type: 'workflow',
          title: 'Automation Notification',
          titleAr: 'تنبيه أتمتة',
          message: input.message as string || 'Workflow action completed',
          messageAr: input.messageAr as string || 'تم تنفيذ إجراء الأتمتة',
          data: JSON.stringify(input),
          read: false,
          createdAt: new Date(),
        })
      }
      return { notified: true, storeId }
    }

    case 'update_price': {
      const inventoryId = input.inventoryId as string
      const newPrice = input.price as number
      if (!inventoryId || !newPrice) return { updated: false, reason: 'Missing inventoryId or price' }
      await db.update(inventory).set({ price: newPrice, updatedAt: new Date() }).where(eq(inventory.id, inventoryId))
      return { updated: true, inventoryId, price: newPrice }
    }

    case 'create_listing':
      return { created: true, listing: input }

    case 'send_whatsapp': {
      const phone = input.phone as string
      const message = input.message as string || ''
      if (!phone) return { sent: false, reason: 'No phone number' }
      const waUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
      return { sent: true, phone, waUrl }
    }

    case 'update_status': {
      const inventoryId = input.inventoryId as string
      const newStatus = input.status as string
      if (!inventoryId || !newStatus) return { updated: false, reason: 'Missing inventoryId or status' }
      await db.update(inventory).set({ status: newStatus, updatedAt: new Date() }).where(eq(inventory.id, inventoryId))
      return { updated: true, inventoryId, status: newStatus }
    }

    default:
      return { unknown: true }
  }
}

export async function checkConditions(conditions: WorkflowCondition[], data: Record<string, unknown>): Promise<boolean> {
  for (const cond of conditions) {
    const fieldValue = data[cond.field]
    switch (cond.operator) {
      case 'equals':
        if (fieldValue !== cond.value) return false
        break
      case 'contains':
        if (!String(fieldValue).includes(String(cond.value))) return false
        break
      case 'greater_than':
        if (Number(fieldValue) <= Number(cond.value)) return false
        break
      case 'less_than':
        if (Number(fieldValue) >= Number(cond.value)) return false
        break
      case 'in':
        if (!Array.isArray(cond.value) || !cond.value.includes(fieldValue)) return false
        break
    }
  }
  return true
}

export async function assignWorkflowToStore(
  storeId: string,
  workflowId: string,
  maxPricePerAction?: number,
  maxActionsPerDay?: number,
  planRequired?: string
) {
  const [assignment] = await db.insert(storeAutomations).values({
    id: crypto.randomUUID(),
    storeId,
    workflowId,
    maxPricePerAction: maxPricePerAction || null,
    maxActionsPerDay: maxActionsPerDay || 100,
    planRequired: planRequired || 'free',
    createdAt: new Date(),
  }).returning()
  return assignment
}

export async function getStoreAutomations(storeId: string) {
  return db.select({
    id: storeAutomations.id,
    workflowId: storeAutomations.workflowId,
    workflowName: workflows.nameAr,
    maxPricePerAction: storeAutomations.maxPricePerAction,
    maxActionsPerDay: storeAutomations.maxActionsPerDay,
    planRequired: storeAutomations.planRequired,
    enabled: storeAutomations.enabled,
    runCount: storeAutomations.runCount,
    lastRunAt: storeAutomations.lastRunAt,
  })
    .from(storeAutomations)
    .innerJoin(workflows, eq(storeAutomations.workflowId, workflows.id))
    .where(eq(storeAutomations.storeId, storeId))
}

export async function canRunAutomation(storeId: string, workflowId: string): Promise<{ allowed: boolean; reason?: string }> {
  const [automation] = await db.select().from(storeAutomations).where(
    and(eq(storeAutomations.storeId, storeId), eq(storeAutomations.workflowId, workflowId))
  )

  if (!automation) return { allowed: false, reason: 'Automation not assigned' }
  if (!automation.enabled) return { allowed: false, reason: 'Automation disabled' }

  // Check subscription plan
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.storeId, storeId)).limit(1)
  const storePlan = sub?.plan || 'free'
  const requiredLevel = PLAN_HIERARCHY[automation.planRequired || 'free'] || 0
  const storeLevel = PLAN_HIERARCHY[storePlan] || 0
  if (storeLevel < requiredLevel) {
    return { allowed: false, reason: `Plan "${automation.planRequired}" required, store has "${storePlan}"` }
  }

  // Check daily run count (fix: use gte for today's start-of-day)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const [{ total }] = await db.select({ total: count() }).from(workflowRuns).where(
    and(
      eq(workflowRuns.storeId, storeId),
      eq(workflowRuns.workflowId, workflowId),
      gte(workflowRuns.startedAt, todayStart)
    )
  )

  if (automation.maxActionsPerDay && Number(total) >= automation.maxActionsPerDay) {
    return { allowed: false, reason: 'Daily limit reached' }
  }

  return { allowed: true }
}

export async function parseWorkflowFromText(text: string): Promise<WorkflowDefinition> {
  // Try AI provider first
  const aiResult = await tryAIProvider(text)
  if (aiResult) return aiResult

  // Fallback to keyword matching
  return parseWithKeywords(text)
}

async function tryAIProvider(text: string): Promise<WorkflowDefinition | null> {
  try {
    const [provider] = await db.select().from(aiProviders).where(eq(aiProviders.enabled, true)).limit(1)
    if (!provider || !provider.apiKey) return null

    const systemPrompt = `You are a workflow parser for an Iraqi auto parts app. Parse the user's text into a workflow definition.
Return ONLY valid JSON with this structure:
{
  "name": "short descriptive name in Arabic",
  "triggerType": "part_added|price_changed|inventory_low|new_request|schedule_daily|schedule_weekly",
  "actions": [{"type": "rewrite_dialect|fetch_photos|notify_store|update_price|send_whatsapp|update_status", "config": {}}]
}

Available triggers: part_added (new part), price_changed (price update), inventory_low (low stock), new_request (new part request), schedule_daily, schedule_weekly
Available actions: rewrite_dialect (convert to Iraqi dialect), fetch_photos (auto-fetch part photos), notify_store (send notification), update_price (update price), send_whatsapp (send WhatsApp), update_status (change status)

Examples:
- "عند إضافة قطعة جديدة، حوّل اسمها للعراقي وجلب صور" -> trigger: part_added, actions: [rewrite_dialect, fetch_photos]
- "عند تغيير السعر، أرسل واتساب للمتجر" -> trigger: price_changed, actions: [send_whatsapp]
- "كل يوم، حدّث المخزون القليل" -> trigger: schedule_daily, actions: [update_status]`

    const response = await fetch(`${provider.apiEndpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: 'groq-llama',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    })

    if (!response.ok) return null

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return null

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.triggerType || !Array.isArray(parsed.actions)) return null

    const validTriggers: TriggerType[] = ['part_added', 'price_changed', 'inventory_low', 'new_request', 'schedule_daily', 'schedule_weekly']
    const validActions = ['rewrite_dialect', 'fetch_photos', 'notify_store', 'update_price', 'send_whatsapp', 'update_status']

    return {
      name: parsed.name || text.slice(0, 50),
      triggerType: validTriggers.includes(parsed.triggerType) ? parsed.triggerType : 'part_added',
      actions: parsed.actions
        .filter((a: { type: string }) => validActions.includes(a.type))
        .map((a: { type: string; config?: Record<string, unknown> }) => ({
          type: a.type as WorkflowAction['type'],
          config: a.config || {},
        })),
    }
  } catch {
    return null
  }
}

function parseWithKeywords(text: string): WorkflowDefinition {
  const lowerText = text.toLowerCase()

  let triggerType: TriggerType = 'part_added'
  if (lowerText.includes('سعر') || lowerText.includes('price')) triggerType = 'price_changed'
  if (lowerText.includes('مخزون') || lowerText.includes('inventory') || lowerText.includes('قليل')) triggerType = 'inventory_low'
  if (lowerText.includes('طلب') || lowerText.includes('request')) triggerType = 'new_request'
  if (lowerText.includes('جداول') || lowerText.includes('يومي') || lowerText.includes('daily')) triggerType = 'schedule_daily'
  if (lowerText.includes('اسبوع') || lowerText.includes('weekly')) triggerType = 'schedule_weekly'

  const actions: WorkflowAction[] = []
  if (lowerText.includes('عراقي') || lowerText.includes('dialect') || lowerText.includes(' اللهجة')) {
    actions.push({ type: 'rewrite_dialect', config: {} })
  }
  if (lowerText.includes('صور') || lowerText.includes('photo') || lowerText.includes('image')) {
    actions.push({ type: 'fetch_photos', config: {} })
  }
  if (lowerText.includes('واتساب') || lowerText.includes('whatsapp')) {
    actions.push({ type: 'send_whatsapp', config: {} })
  }
  if (lowerText.includes('تنبيه') || lowerText.includes('notify') || lowerText.includes('ارسل')) {
    actions.push({ type: 'notify_store', config: {} })
  }
  if ((lowerText.includes('سعر') || lowerText.includes('price')) && lowerText.includes('update')) {
    actions.push({ type: 'update_price', config: {} })
  }
  if (lowerText.includes('حالة') || lowerText.includes('status')) {
    actions.push({ type: 'update_status', config: {} })
  }

  if (actions.length === 0) {
    actions.push({ type: 'notify_store', config: {} })
  }

  return {
    name: text.slice(0, 50),
    triggerType,
    actions,
  }
}
