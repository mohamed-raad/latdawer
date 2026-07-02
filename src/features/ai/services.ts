import { db } from '@/db'
import { aiProviders, aiModels, aiUsage, aiConversations, aiMessages, aiPhotoSuggestions, aiKnowledgeBase } from '@/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { encryptApiKey, maskApiKey } from '@/lib/encryption'

export interface AIProviderConfig {
  name: string
  slug: string
  apiEndpoint: string
  apiKey?: string
  enabled?: boolean
}

export interface AIModelConfig {
  providerId: string
  modelId: string
  name: string
  maxTokens?: number
  costPer1kTokens?: number
}

export interface ProviderListItem {
  id: string
  name: string
  slug: string
  apiEndpoint: string
  apiKeyMasked: string
  enabled: boolean
  config: string | null
  createdAt: Date
}

const IRAQI_DIALECT_PROMPT = `You are an AI assistant specialized in automotive spare parts, speaking in Iraqi Arabic dialect.

You help store owners manage their inventory by:
1. Understanding Iraqi automotive terminology
2. Identifying spare parts from descriptions
3. Searching for product photos
4. Guiding inventory creation

IRAQI AUTOMOTIVE TERMINOLOGY:
- لايت = light (إضاءة)
- بولي = pulley (بكرة)
- قايش = belt (حزام)
- كشن = seat cushion (مقعد)
- كير = transmission (ناقل حركة)
- سلف = starter (محرك بدء)
- راديتر = radiator (المبرد)
- فلتر = filter (مرشح)
- برمجة = ECU (وحدة التحكم)
- اكسل = differential (التفاضلي)
- سايق = driver (السائق)
- دينمو = alternator (الدينمو)
- شن = shock absorber (ممتص صدمات)
- دبل = differential lock
- كرسي = seat (مقعد)
- ليات = lights (إضاءة)

WHEN USER DESCRIBES ITEMS:
1. List all identified items
2. For each item, search for photos
3. Show photos with accept/reject buttons
4. After photo acceptance, ask for:
   - الكمية (quantity)
    - الحالة: جديد/مستعمل/تشليح (condition)
   - السعر بالدينار (price in IQD)
   - رقم القطعة (part number)
   - الماركة (brand)
   - التوافق مع السيارات (compatible vehicles)`

// ─── Provider CRUD ───

export async function createProvider(data: AIProviderConfig) {
  const apiKeyEncrypted = data.apiKey ? await encryptApiKey(data.apiKey) : null
  const [provider] = await db.insert(aiProviders).values({
    id: crypto.randomUUID(),
    name: data.name,
    slug: data.slug,
    apiEndpoint: data.apiEndpoint,
    apiKey: apiKeyEncrypted,
    enabled: data.enabled ?? true,
    createdAt: new Date(),
  }).returning()
  return provider
}

export async function updateProvider(id: string, data: Partial<AIProviderConfig>) {
  const updateData: Record<string, unknown> = { ...data }
  if (data.apiKey) {
    updateData.apiKey = await encryptApiKey(data.apiKey)
  }
  const [provider] = await db.update(aiProviders)
    .set(updateData)
    .where(eq(aiProviders.id, id))
    .returning()
  return provider
}

export async function deleteProvider(id: string) {
  await db.delete(aiProviders).where(eq(aiProviders.id, id))
}

export async function listProviders(): Promise<ProviderListItem[]> {
  const providers = await db.select().from(aiProviders).orderBy(desc(aiProviders.createdAt))
  return providers.map((p) => ({
    ...p,
    apiKeyMasked: p.apiKey ? maskApiKey(decryptApiKeySafe(p.apiKey)) : 'Not set',
  }))
}

export async function getProvider(id: string) {
  const [provider] = await db.select().from(aiProviders).where(eq(aiProviders.id, id))
  return provider
}

export async function getProviderApiKey(id: string): Promise<string | null> {
  const [provider] = await db.select().from(aiProviders).where(eq(aiProviders.id, id))
  if (!provider?.apiKey) return null
  return decryptApiKeySafe(provider.apiKey)
}

// ─── Model CRUD ───

export async function createModel(data: AIModelConfig) {
  const [model] = await db.insert(aiModels).values({
    id: crypto.randomUUID(),
    ...data,
    maxTokens: data.maxTokens ?? 4096,
    costPer1kTokens: data.costPer1kTokens ?? 0,
    enabled: true,
    createdAt: new Date(),
  }).returning()
  return model
}

export async function updateModel(id: string, data: Partial<AIModelConfig & { enabled: boolean }>) {
  const [model] = await db.update(aiModels)
    .set(data)
    .where(eq(aiModels.id, id))
    .returning()
  return model
}

export async function deleteModel(id: string) {
  await db.delete(aiModels).where(eq(aiModels.id, id))
}

export async function listModels(providerId?: string) {
  if (providerId) {
    return db.select().from(aiModels).where(eq(aiModels.providerId, providerId))
  }
  return db.select().from(aiModels)
}

export async function getEnabledModels() {
  return db.select().from(aiModels).where(eq(aiModels.enabled, true))
}

// ─── Model Fetching from Providers ───

export interface FetchedModel {
  id: string
  name: string
  contextLength?: number
  maxOutput?: number
}

export async function fetchModelsFromProvider(
  slug: string,
  apiKey: string
): Promise<FetchedModel[]> {
  switch (slug) {
    case 'groq':
      return fetchGroqModels(apiKey)
    case 'gemini':
      return fetchGeminiModels(apiKey)
    case 'mistral':
      return fetchMistralModels(apiKey)
    case 'nvidia-nim':
      return fetchNvidiaNimModels(apiKey)
    default:
      throw new Error(`Unsupported provider: ${slug}`)
  }
}

async function fetchGroqModels(apiKey: string): Promise<FetchedModel[]> {
  const response = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!response.ok) throw new Error(`Groq API error: ${response.status}`)
  const data = await response.json()
  return (data.data || []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    name: (m.id as string).replace('llama3-', 'Llama 3 ').replace('gemma-', 'Gemma '),
    contextLength: (m.context_window as number) || 8192,
    maxOutput: (m.max_completion_tokens as number) || 2048,
  }))
}

async function fetchGeminiModels(apiKey: string): Promise<FetchedModel[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  )
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)
  const data = await response.json()
  return (data.models || [])
    .filter((m: Record<string, unknown>) =>
      (m.supportedGenerationMethods as string[])?.includes('generateContent')
    )
    .map((m: Record<string, unknown>) => ({
      id: (m.name as string).replace('models/', ''),
      name: m.displayName as string,
      contextLength: (m.inputTokenLimit as number) || 32768,
      maxOutput: (m.outputTokenLimit as number) || 8192,
    }))
}

async function fetchMistralModels(apiKey: string): Promise<FetchedModel[]> {
  const response = await fetch('https://api.mistral.ai/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!response.ok) throw new Error(`Mistral API error: ${response.status}`)
  const data = await response.json()
  return (data.data || []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    name: (m.id as string).replace('-', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    contextLength: (m.context_length as number) || 32768,
    maxOutput: (m.max_completion_tokens as number) || 4096,
  }))
}

async function fetchNvidiaNimModels(apiKey: string): Promise<FetchedModel[]> {
  const response = await fetch('https://integrate.api.nvidia.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!response.ok) throw new Error(`Nvidia NIM API error: ${response.status}`)
  const data = await response.json()
  return (data.data || []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    name: (m.id as string).split('/').pop() as string,
    contextLength: (m.context_window as number) || 4096,
    maxOutput: (m.max_tokens as number) || 2048,
  }))
}

// ─── AI Chat ───

export interface AIResponse {
  content: string
  model?: string
  tokensUsed?: number
  photoSearches?: Array<{ url: string; source: string; searchTerm: string }>
}

export async function generateAIResponse(
  systemPrompt: string,
  userMessage: string,
  conversationId: string,
  modelId?: string
): Promise<AIResponse> {
  const messages = await getMessages(conversationId)
  const history = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  // Find the model to use
  const targetModelId = modelId
  let providerSlug = 'groq'
  let apiKey: string | null = null

  if (targetModelId) {
    const [model] = await db.select().from(aiModels).where(eq(aiModels.id, targetModelId))
    if (model) {
      const provider = await getProvider(model.providerId)
      if (provider) {
        providerSlug = provider.slug
        apiKey = await getProviderApiKey(provider.id)
      }
    }
  }

  if (!apiKey) {
    apiKey = process.env.GROQ_API_KEY || ''
    providerSlug = 'groq'
  }

  try {
    const response = await callProviderAPI(providerSlug, apiKey, {
      systemPrompt,
      messages: [...history.slice(-10), { role: 'user', content: userMessage }],
      model: targetModelId ? undefined : 'llama3-8b-8192',
    })

    const photoSearches = extractPhotoSearches(response.content)

    return {
      content: response.content,
      model: providerSlug,
      tokensUsed: response.tokensUsed,
      photoSearches,
    }
  } catch (error) {
    logger.error('AI response generation failed', error as Error)
    return {
      content: 'شلونك! شكو ماكو؟ أنا هنا أساعدك إدارة متجرك.',
      model: 'fallback',
      tokensUsed: 0,
    }
  }
}

async function callProviderAPI(
  providerSlug: string,
  apiKey: string,
  options: {
    systemPrompt: string
    messages: Array<{ role: string; content: string }>
    model?: string
  }
): Promise<{ content: string; tokensUsed: number }> {
  if (providerSlug === 'gemini') {
    return callGeminiAPI(apiKey, options)
  }

  // OpenAI-compatible providers (Groq, Mistral, Nvidia NIM)
  const endpointMap: Record<string, string> = {
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    mistral: 'https://api.mistral.ai/v1/chat/completions',
    'nvidia-nim': 'https://integrate.api.nvidia.com/v1/chat/completions',
  }

  const endpoint = endpointMap[providerSlug] || endpointMap.groq
  const model = options.model || 'llama3-8b-8192'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: options.systemPrompt },
        ...options.messages,
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  })

  if (!response.ok) {
    throw new Error(`${providerSlug} API error: ${response.status}`)
  }

  const data = await response.json()
  return {
    content: data.choices?.[0]?.message?.content || '',
    tokensUsed: data.usage?.total_tokens || 0,
  }
}

async function callGeminiAPI(
  apiKey: string,
  options: {
    systemPrompt: string
    messages: Array<{ role: string; content: string }>
    model?: string
  }
): Promise<{ content: string; tokensUsed: number }> {
  const model = options.model || 'gemini-2.0-flash'
  const contents = options.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: options.systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    tokensUsed: data.usageMetadata?.totalTokenCount || 0,
  }
}

function extractPhotoSearches(content: string): Array<{ url: string; source: string; searchTerm: string }> {
  const photos: Array<{ url: string; source: string; searchTerm: string }> = []
  const searchTermMatch = content.match(/\[PHOTO_SEARCH:(.*?)\]/g)
  if (searchTermMatch) {
    for (const match of searchTermMatch) {
      const term = match.replace('[PHOTO_SEARCH:', '').replace(']', '')
      photos.push({
        url: `https://via.placeholder.com/300x200?text=${encodeURIComponent(term)}`,
        source: 'suggested',
        searchTerm: term,
      })
    }
  }
  return photos
}

// ─── Usage ───

export async function checkUsageLimit(userId: string, dailyLimit: number): Promise<boolean> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [usage] = await db
    .select({ count: sql<number>`count(*)` })
    .from(aiUsage)
    .where(
      and(
        eq(aiUsage.userId, userId),
        sql`${aiUsage.createdAt} >= ${today.getTime()}`
      )
    )

  return (usage?.count ?? 0) < dailyLimit
}

export async function recordUsage(userId: string, modelId: string, tokensUsed: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const period = today.toISOString().split('T')[0]

  await db.insert(aiUsage).values({
    id: crypto.randomUUID(),
    userId,
    modelId,
    tokensUsed,
    requestCount: 1,
    period,
    createdAt: new Date(),
  })
}

// ─── Conversations ───

export async function createConversation(userId: string, storeId?: string, title?: string) {
  const now = new Date()
  const [conversation] = await db.insert(aiConversations).values({
    id: crypto.randomUUID(),
    userId,
    storeId,
    title: title || 'محادثة جديدة',
    createdAt: now,
    updatedAt: now,
  }).returning()
  return conversation
}

export async function listConversations(userId: string) {
  return db.select().from(aiConversations)
    .where(eq(aiConversations.userId, userId))
    .orderBy(desc(aiConversations.updatedAt))
}

export async function getConversation(id: string) {
  const [conversation] = await db.select().from(aiConversations).where(eq(aiConversations.id, id))
  return conversation
}

export async function addMessage(conversationId: string, role: string, content: string, metadata?: Record<string, unknown>) {
  const [message] = await db.insert(aiMessages).values({
    id: crypto.randomUUID(),
    conversationId,
    role,
    content,
    metadata: metadata ? JSON.stringify(metadata) : null,
    createdAt: new Date(),
  }).returning()

  await db.update(aiConversations)
    .set({ updatedAt: new Date() })
    .where(eq(aiConversations.id, conversationId))

  return message
}

export async function getMessages(conversationId: string) {
  return db.select().from(aiMessages)
    .where(eq(aiMessages.conversationId, conversationId))
    .orderBy(aiMessages.createdAt)
}

// ─── Photo Suggestions ───

export async function addPhotoSuggestion(messageId: string, imageUrl: string, source: string, searchTerm: string) {
  const [suggestion] = await db.insert(aiPhotoSuggestions).values({
    id: crypto.randomUUID(),
    messageId,
    imageUrl,
    source,
    searchTerm,
    status: 'pending',
    createdAt: new Date(),
  }).returning()
  return suggestion
}

export async function updatePhotoStatus(id: string, status: 'accepted' | 'rejected') {
  const [suggestion] = await db.update(aiPhotoSuggestions)
    .set({ status })
    .where(eq(aiPhotoSuggestions.id, id))
    .returning()
  return suggestion
}

export async function getPhotoSuggestions(messageId: string) {
  return db.select().from(aiPhotoSuggestions)
    .where(eq(aiPhotoSuggestions.messageId, messageId))
}

// ─── Knowledge Base ───

export async function addKnowledgeEntry(term: string, translation: string, category?: string) {
  const [entry] = await db.insert(aiKnowledgeBase).values({
    id: crypto.randomUUID(),
    term,
    translation,
    category,
    dialect: 'iq',
    verified: false,
    createdAt: new Date(),
  }).returning()
  return entry
}

export async function getKnowledgeBase() {
  return db.select().from(aiKnowledgeBase)
}

export async function getSystemPrompt(): Promise<string> {
  const knowledge = await getKnowledgeBase()
  const knowledgeText = knowledge.map((k) => `${k.term} = ${k.translation}`).join('\n')
  return `${IRAQI_DIALECT_PROMPT}\n\nKNOWLEDGE BASE:\n${knowledgeText}`
}

// ─── Helpers ───

function decryptApiKeySafe(encrypted: string): string {
  try {
    // In Cloudflare Workers, this would be async
    // For now, use synchronous fallback for local dev
    return encrypted
  } catch {
    return '****'
  }
}
