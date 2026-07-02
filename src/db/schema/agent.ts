import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { users } from './users'

export const aiAgents = sqliteTable('ai_agents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  apiKey: text('api_key').notNull().unique(),
  permissions: text('permissions').notNull().default('read'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  rateLimit: integer('rate_limit').notNull().default(100),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const aiAgentLogs = sqliteTable('ai_agent_logs', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull().references(() => aiAgents.id),
  endpoint: text('endpoint').notNull(),
  method: text('method').notNull(),
  statusCode: integer('status_code').notNull(),
  requestBody: text('request_body'),
  responseBody: text('response_body'),
  ipAddress: text('ip_address'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const PERMISSION_SCOPES = {
  READ: 'read',
  WRITE: 'write',
  ADMIN: 'admin',
  AI_CONTROL: 'ai_control',
  ADS_CONTROL: 'ads_control',
  STORE_MANAGEMENT: 'store_management',
} as const

export type PermissionScope = typeof PERMISSION_SCOPES[keyof typeof PERMISSION_SCOPES]