import { getStores, getStoreById, createStore, updateStore, addStoreManager, getStoreByManager } from './repository'
import { createStoreSchema, updateStoreSchema } from './validators'
import { db } from '@/db'
import { auditLogs } from '@/db/schema'

export async function listStores(params: Record<string, unknown>) {
  const page = (params.page as number) ?? 1
  const limit = (params.limit as number) ?? 20
  return getStores(page, limit)
}

export async function getStore(id: string) {
  return getStoreById(id)
}

export async function createNewStore(data: unknown, userId: string) {
  const parsed = createStoreSchema.parse(data)
  const now = new Date()
  const store = await createStore({
    id: crypto.randomUUID(),
    ...parsed,
    ownerId: userId,
    createdAt: now,
    updatedAt: now,
  })
  await addStoreManager(userId, store.id)
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    userId,
    action: 'create_store',
    entity: 'store',
    entityId: store.id,
    createdAt: new Date(),
  })
  return store
}

export async function editStore(id: string, data: unknown, userId: string) {
  const parsed = updateStoreSchema.parse(data)
  const store = await updateStore(id, { ...parsed, updatedAt: new Date() })
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    userId,
    action: 'update_store',
    entity: 'store',
    entityId: id,
    createdAt: new Date(),
  })
  return store
}

export async function getMyStore(userId: string) {
  return getStoreByManager(userId)
}
