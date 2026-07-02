import {
  getDashboardStats,
  getUsers,
  updateUserRole,
  verifyStore,
  createCategory,
  createManufacturer,
  getAuditLogs,
  getAnalytics,
} from './repository'
import { createCategorySchema, createManufacturerSchema, updateUserRoleSchema } from './validators'
import { NotFoundError } from '@/lib/errors'

export async function dashboardStats() {
  return getDashboardStats()
}

export async function listUsers(params: { page?: number; limit?: number }) {
  return getUsers(params.page || 1, params.limit || 20)
}

export async function changeUserRole(data: unknown) {
  const { userId, role } = updateUserRoleSchema.parse(data)
  const user = await updateUserRole(userId, role)
  if (!user) {
    throw new NotFoundError('User', userId)
  }
  return user
}

export async function approveStore(storeId: string) {
  const store = await verifyStore(storeId)
  if (!store) {
    throw new NotFoundError('Store', storeId)
  }
  return store
}

export async function rejectStore(storeId: string, reason: string) {
  const { updateStoreStatus, createAuditLog } = await import('./repository')
  await updateStoreStatus(storeId, 'rejected')
  await createAuditLog({
    action: 'store_rejected',
    entity: 'store',
    entityId: storeId,
    details: { reason },
  })
  return { success: true }
}

export async function addCategory(data: unknown) {
  const parsed = createCategorySchema.parse(data)
  return createCategory({ id: crypto.randomUUID(), ...parsed, createdAt: new Date() })
}

export async function addManufacturer(data: unknown) {
  const parsed = createManufacturerSchema.parse(data)
  return createManufacturer({ id: crypto.randomUUID(), ...parsed, createdAt: new Date() })
}

export async function listCategories() {
  const { getCategories } = await import('./repository')
  return getCategories()
}

export async function updateCategory(id: string, data: { name: string; nameAr: string; slug: string }) {
  const { updateCategory: updateCategoryRepo } = await import('./repository')
  return updateCategoryRepo(id, data)
}

export async function deleteCategory(id: string) {
  const { deleteCategory: deleteCategoryRepo } = await import('./repository')
  return deleteCategoryRepo(id)
}

export async function listManufacturers() {
  const { getManufacturers } = await import('./repository')
  return getManufacturers()
}

export async function updateManufacturer(id: string, data: { name: string; nameAr: string; slug: string; country?: string }) {
  const { updateManufacturer: updateManufacturerRepo } = await import('./repository')
  return updateManufacturerRepo(id, data)
}

export async function deleteManufacturer(id: string) {
  const { deleteManufacturer: deleteManufacturerRepo } = await import('./repository')
  return deleteManufacturerRepo(id)
}

export async function auditLogsService(params: { page?: number; limit?: number }) {
  return getAuditLogs(params.page || 1, params.limit || 50)
}

export async function analyticsService() {
  return getAnalytics()
}

export async function listSubscriptions() {
  const { getSubscriptions } = await import('./repository')
  return getSubscriptions()
}

export async function updateSubscriptionPlan(data: { plan: string; price: number; features: string[]; inventoryLimit: number }) {
  const { updateSubscriptionPlan: updatePlan } = await import('./repository')
  return updatePlan(data)
}

export async function setDiscount(subscriptionId: string, discountPercent: number) {
  const { setSubscriptionDiscount } = await import('./repository')
  return setSubscriptionDiscount(subscriptionId, discountPercent)
}

export async function configurePaymentMethods(methods: string[], enabled: boolean) {
  const { configurePaymentMethods: configureMethods } = await import('./repository')
  return configureMethods(methods, enabled)
}
