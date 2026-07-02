import { db } from '@/db'
import { aiAgents, aiAgentLogs, stores, inventory, storeAds, categories, manufacturers, users } from '@/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import crypto from 'crypto'

export interface AgentPermissions {
  read: boolean
  write: boolean
  admin: boolean
  ai_control: boolean
  ads_control: boolean
  store_management: boolean
}

function parsePermissions(permissions: string): AgentPermissions {
  const scopes = permissions.split(',').map(s => s.trim())
  return {
    read: scopes.includes('read') || scopes.includes('admin'),
    write: scopes.includes('write') || scopes.includes('admin'),
    admin: scopes.includes('admin'),
    ai_control: scopes.includes('ai_control') || scopes.includes('admin'),
    ads_control: scopes.includes('ads_control') || scopes.includes('admin'),
    store_management: scopes.includes('store_management') || scopes.includes('admin'),
  }
}

export function generateApiKey(): string {
  return `cpa_${crypto.randomBytes(32).toString('hex')}`
}

export async function createAgent(userId: string, name: string, description: string, permissions: string) {
  const apiKey = generateApiKey()
  const [agent] = await db.insert(aiAgents).values({
    id: crypto.randomUUID(),
    userId,
    name,
    description,
    apiKey,
    permissions,
    enabled: true,
    rateLimit: 100,
    createdAt: new Date(),
  }).returning()
  return { ...agent, apiKey }
}

export async function updateAgent(id: string, data: Partial<{ name: string; description: string; permissions: string; enabled: boolean; rateLimit: number }>) {
  const [agent] = await db.update(aiAgents)
    .set(data)
    .where(eq(aiAgents.id, id))
    .returning()
  return agent
}

export async function deleteAgent(id: string) {
  await db.delete(aiAgents).where(eq(aiAgents.id, id))
}

export async function listAgents(userId: string) {
  return db.select().from(aiAgents)
    .where(eq(aiAgents.userId, userId))
    .orderBy(desc(aiAgents.createdAt))
}

export async function getAgentByApiKey(apiKey: string) {
  const [agent] = await db.select().from(aiAgents)
    .where(and(eq(aiAgents.apiKey, apiKey), eq(aiAgents.enabled, true)))
  return agent
}

export async function validateAgentAccess(apiKey: string, requiredPermission: keyof AgentPermissions): Promise<{ agent: typeof aiAgents.$inferSelect; permissions: AgentPermissions } | null> {
  const agent = await getAgentByApiKey(apiKey)
  if (!agent) return null

  const permissions = parsePermissions(agent.permissions)
  if (!permissions[requiredPermission] && !permissions.admin) return null

  await db.update(aiAgents)
    .set({ lastUsedAt: new Date() })
    .where(eq(aiAgents.id, agent.id))

  return { agent, permissions }
}

export async function logAgentRequest(agentId: string, endpoint: string, method: string, statusCode: number, requestBody?: string, responseBody?: string, ipAddress?: string) {
  await db.insert(aiAgentLogs).values({
    id: crypto.randomUUID(),
    agentId,
    endpoint,
    method,
    statusCode,
    requestBody,
    responseBody: responseBody?.substring(0, 1000),
    ipAddress,
    createdAt: new Date(),
  })
}

export async function getAgentLogs(agentId: string, limit = 50) {
  return db.select().from(aiAgentLogs)
    .where(eq(aiAgentLogs.agentId, agentId))
    .orderBy(desc(aiAgentLogs.createdAt))
    .limit(limit)
}

// AI Agent API Operations

export async function agentSearchParts(query: string, filters?: Record<string, unknown>) {
  const { searchParts } = await import('@/features/search/repository')
  return searchParts({
    q: query,
    page: 1,
    limit: 20,
    categoryId: filters?.categoryId as string,
    manufacturerId: filters?.manufacturerId as string,
    city: filters?.city as string,
    inStockOnly: filters?.inStockOnly as boolean,
    minPrice: filters?.minPrice as number,
    maxPrice: filters?.maxPrice as number,
  })
}

export async function agentGetStore(storeId: string) {
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId))
  return store
}

export async function agentListStores(filters?: { city?: string; verified?: string }) {
  const conditions = []
  if (filters?.city) conditions.push(eq(stores.city, filters.city))
  if (filters?.verified) conditions.push(eq(stores.verified, filters.verified))

  if (conditions.length > 0) {
    return db.select().from(stores).where(and(...conditions))
  }
  return db.select().from(stores)
}

export async function agentVerifyStore(storeId: string) {
  await db.update(stores).set({ verified: 'verified', updatedAt: new Date() }).where(eq(stores.id, storeId))
  return { success: true }
}

export async function agentRejectStore(storeId: string, reason: string) {
  await db.update(stores).set({ verified: 'rejected', updatedAt: new Date() }).where(eq(stores.id, storeId))
  return { success: true, reason }
}

export async function agentGetInventory(storeId?: string) {
  const { inventory: inventoryTable } = await import('@/db/schema')
  if (storeId) {
    return db.select().from(inventoryTable).where(eq(inventoryTable.storeId, storeId))
  }
  return db.select().from(inventoryTable)
}

export async function agentListCategories() {
  return db.select().from(categories)
}

export async function agentListManufacturers() {
  return db.select().from(manufacturers)
}

export async function agentCreateAd(data: {
  storeId: string
  title: string
  titleAr: string
  budget: number
  startDate: Date
  endDate: Date
  targetQuery?: string
  targetCategory?: string
}) {
  const [ad] = await db.insert(storeAds).values({
    id: crypto.randomUUID(),
    ...data,
    spent: 0,
    clicks: 0,
    impressions: 0,
    status: 'active',
    createdAt: new Date(),
  }).returning()
  return ad
}

export async function agentListAds() {
  return db.select().from(storeAds).orderBy(desc(storeAds.createdAt))
}

export async function agentUpdateAd(id: string, data: Partial<{ status: string; budget: number }>) {
  const [ad] = await db.update(storeAds)
    .set(data)
    .where(eq(storeAds.id, id))
    .returning()
  return ad
}

export async function agentGetDashboardStats() {
  const [userCount] = await db.select({ total: sql<number>`count(*)` }).from(users)
  const [storeCount] = await db.select({ total: sql<number>`count(*)` }).from(stores)
  const [partCount] = await db.select({ total: sql<number>`count(*)` }).from(inventory)

  return {
    users: userCount?.total ?? 0,
    stores: storeCount?.total ?? 0,
    parts: partCount?.total ?? 0,
  }
}

export async function agentControlAI(action: 'list_providers' | 'list_models' | 'get_usage', _params?: Record<string, unknown>) {
  const { aiProviders, aiModels, aiUsage } = await import('@/db/schema')

  switch (action) {
    case 'list_providers':
      return db.select().from(aiProviders)
    case 'list_models':
      return db.select().from(aiModels)
    case 'get_usage':
      return db.select().from(aiUsage).orderBy(desc(aiUsage.createdAt)).limit(100)
    default:
      return { error: 'Unknown action' }
  }
}