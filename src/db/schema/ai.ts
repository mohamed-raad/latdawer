import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { users, stores } from './users'

export const aiProviders = sqliteTable('ai_providers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  apiEndpoint: text('api_endpoint').notNull(),
  apiKey: text('api_key'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  config: text('config'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const aiModels = sqliteTable('ai_models', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').notNull().references(() => aiProviders.id),
  modelId: text('model_id').notNull(),
  name: text('name').notNull(),
  maxTokens: integer('max_tokens').notNull().default(4096),
  costPer1kTokens: real('cost_per_1k_tokens').default(0),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const aiUsage = sqliteTable('ai_usage', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  modelId: text('model_id').notNull().references(() => aiModels.id),
  tokensUsed: integer('tokens_used').notNull().default(0),
  requestCount: integer('request_count').notNull().default(1),
  period: text('period').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const aiConversations = sqliteTable('ai_conversations', {
  id: text('id').primaryKey(),
  storeId: text('store_id').references(() => stores.id),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const aiMessages = sqliteTable('ai_messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => aiConversations.id),
  role: text('role').notNull(),
  content: text('content').notNull(),
  metadata: text('metadata'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const aiPhotoSuggestions = sqliteTable('ai_photo_suggestions', {
  id: text('id').primaryKey(),
  messageId: text('message_id').notNull().references(() => aiMessages.id),
  imageUrl: text('image_url').notNull(),
  source: text('source'),
  searchTerm: text('search_term'),
  status: text('status').notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const aiKnowledgeBase = sqliteTable('ai_knowledge_base', {
  id: text('id').primaryKey(),
  term: text('term').notNull(),
  translation: text('translation').notNull(),
  category: text('category'),
  dialect: text('dialect').default('iq'),
  verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})