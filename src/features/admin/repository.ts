import { db } from '@/db'
import { users, stores, categories, manufacturers, parts, inventory, auditLogs, analytics, subscriptions } from '@/db/schema'
import { eq, count, desc } from 'drizzle-orm'

export async function getDashboardStats() {
  const [userCount] = await db.select({ total: count() }).from(users)
  const [storeCount] = await db.select({ total: count() }).from(stores)
  const [partCount] = await db.select({ total: count() }).from(parts)
  const [inventoryCount] = await db.select({ total: count() }).from(inventory)
  return {
    users: Number(userCount.total),
    stores: Number(storeCount.total),
    parts: Number(partCount.total),
    inventory: Number(inventoryCount.total),
  }
}

export async function getUsers(page = 1, limit = 20) {
  const offset = (page - 1) * limit
  const results = await db.select().from(users).limit(limit).offset(offset)
  const [{ total }] = await db.select({ total: count() }).from(users)
  return { results, total: Number(total), page, limit }
}

export async function updateUserRole(userId: string, role: string) {
  const [user] = await db.update(users).set({ role } as typeof users.$inferInsert).where(eq(users.id, userId)).returning()
  return user
}

export async function verifyStore(storeId: string) {
  const [store] = await db.update(stores).set({ verified: 'verified' }).where(eq(stores.id, storeId)).returning()
  return store
}

export async function createCategory(data: typeof categories.$inferInsert) {
  const [cat] = await db.insert(categories).values(data).returning()
  return cat
}

export async function createManufacturer(data: typeof manufacturers.$inferInsert) {
  const [man] = await db.insert(manufacturers).values(data).returning()
  return man
}

export async function getCategories() {
  return db.select().from(categories).orderBy(categories.nameAr)
}

export async function updateCategory(id: string, data: { name: string; nameAr: string; slug: string }) {
  const [cat] = await db.update(categories).set(data).where(eq(categories.id, id)).returning()
  return cat
}

export async function deleteCategory(id: string) {
  await db.delete(categories).where(eq(categories.id, id))
}

export async function getManufacturers() {
  return db.select().from(manufacturers).orderBy(manufacturers.nameAr)
}

export async function updateManufacturer(id: string, data: { name: string; nameAr: string; slug: string; country?: string }) {
  const [man] = await db.update(manufacturers).set(data).where(eq(manufacturers.id, id)).returning()
  return man
}

export async function deleteManufacturer(id: string) {
  await db.delete(manufacturers).where(eq(manufacturers.id, id))
}

export async function updateStoreStatus(storeId: string, status: string) {
  await db.update(stores).set({ verified: status, updatedAt: new Date() }).where(eq(stores.id, storeId))
}

export async function createAuditLog(data: { action: string; entity: string; entityId: string; details: Record<string, unknown> }) {
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    userId: '', // Will be set by service
    action: data.action,
    entity: data.entity,
    entityId: data.entityId,
    details: JSON.stringify(data.details),
    createdAt: new Date(),
  })
}

export async function getAuditLogs(page = 1, limit = 50) {
  const offset = (page - 1) * limit
  const results = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset)
  const [{ total }] = await db.select({ total: count() }).from(auditLogs)
  return { results, total: Number(total), page, limit }
}

export async function getAnalytics() {
  return db.select().from(analytics).orderBy(desc(analytics.createdAt)).limit(100)
}

export async function getSubscriptions() {
  return db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt))
}

export async function updateSubscriptionPlan(data: { plan: string; price: number; features: string[]; inventoryLimit: number }) {
  // For now, just return the plan data as we don't have a subscription plans table
  return data
}

export async function setSubscriptionDiscount(subscriptionId: string, discountPercent: number) {
  const [sub] = await db.update(subscriptions)
    .set({ discount: discountPercent })
    .where(eq(subscriptions.id, subscriptionId))
    .returning()
  return sub
}

export async function configurePaymentMethods(methods: string[], enabled: boolean) {
  // For now, just return the configuration
  return { methods, enabled }
}
