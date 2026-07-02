import {
  getInventoryByStore,
  createInventory,
  updateInventory,
  deleteInventory,
  getInventoryById,
  getInventoryByPartId,
  getByPartSortedByPrice,
} from './repository'
import { createInventorySchema, updateInventorySchema, inventoryQuerySchema } from './validators'
import { db } from '@/db'
import { auditLogs } from '@/db/schema'

export async function listInventory(params: Record<string, unknown>) {
  const { storeId, page, limit } = inventoryQuerySchema.parse({
    ...params,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  })

  if (!storeId) return { results: [], total: 0, page, limit }
  return getInventoryByStore(storeId, page, limit)
}

export async function addInventory(data: unknown, userId: string) {
  const parsed = createInventorySchema.parse(data)
  const item = await createInventory({
    id: crypto.randomUUID(),
    partId: parsed.partId,
    storeId: parsed.storeId,
    price: parsed.price,
    currency: parsed.currency,
    quantity: parsed.quantity,
    condition: parsed.condition,
    installationPrice: parsed.installationPrice ?? null,
    notes: parsed.notes,
    notesAr: parsed.notesAr,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    userId,
    action: 'create_inventory',
    entity: 'inventory',
    entityId: item.id,
    details: JSON.stringify({ partId: parsed.partId }),
    createdAt: new Date(),
  })
  return item
}

export async function editInventory(id: string, data: unknown, userId: string) {
  const parsed = updateInventorySchema.parse(data)
  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (parsed.price !== undefined) updateData.price = parsed.price
  if (parsed.quantity !== undefined) updateData.quantity = parsed.quantity
  if (parsed.condition !== undefined) updateData.condition = parsed.condition
  if (parsed.notes !== undefined) updateData.notes = parsed.notes
  if (parsed.notesAr !== undefined) updateData.notesAr = parsed.notesAr
  if (parsed.installationPrice !== undefined) updateData.installationPrice = parsed.installationPrice
  if (parsed.currency !== undefined) updateData.currency = parsed.currency

  const item = await updateInventory(id, updateData)
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    userId,
    action: 'update_inventory',
    entity: 'inventory',
    entityId: id,
    details: JSON.stringify(parsed),
    createdAt: new Date(),
  })
  return item
}

export async function removeInventory(id: string, userId: string) {
  await deleteInventory(id)
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    userId,
    action: 'delete_inventory',
    entity: 'inventory',
    entityId: id,
    createdAt: new Date(),
  })
}

export async function getInventoryDetails(id: string) {
  return getInventoryById(id)
}

export async function getInventoryForPart(partId: string) {
  return getInventoryByPartId(partId)
}

export async function comparePrices(partId: string) {
  return getByPartSortedByPrice(partId)
}
