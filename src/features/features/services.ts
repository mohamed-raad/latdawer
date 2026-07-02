import { db } from '@/db'
import { priceAlerts, storeAds, notifications, loyaltyPoints, loyaltyTransactions, barcodeScans, inventory } from '@/db/schema'
import { eq, and, sql, desc, gte, lte, ilike } from 'drizzle-orm'

export async function createPriceAlert(userId: string, partId: string, targetPrice?: number, storeId?: string) {
  const [alert] = await db.insert(priceAlerts).values({
    id: crypto.randomUUID(),
    userId,
    partId,
    storeId,
    targetPrice,
    enabled: true,
    createdAt: new Date(),
  }).returning()
  return alert
}

export async function deletePriceAlert(id: string) {
  await db.delete(priceAlerts).where(eq(priceAlerts.id, id))
}

export async function listPriceAlerts(userId: string) {
  return db.select().from(priceAlerts)
    .where(eq(priceAlerts.userId, userId))
    .orderBy(desc(priceAlerts.createdAt))
}

export async function checkPriceAlerts() {
  const alerts = await db.select().from(priceAlerts)
    .where(eq(priceAlerts.enabled, true))

  const triggeredAlerts = []

  for (const alert of alerts) {
    const [inventoryItem] = await db.select().from(inventory)
      .where(eq(inventory.partId, alert.partId))
      .orderBy(inventory.price)
      .limit(1)

    if (inventoryItem && alert.targetPrice && inventoryItem.price <= alert.targetPrice) {
      triggeredAlerts.push({ alert, price: inventoryItem.price, storeId: inventoryItem.storeId })
    }
  }

  return triggeredAlerts
}

export async function createNotification(userId: string, type: string, title: string, titleAr: string, message: string, messageAr: string, data?: Record<string, unknown>) {
  const [notification] = await db.insert(notifications).values({
    id: crypto.randomUUID(),
    userId,
    type,
    title,
    titleAr,
    message,
    messageAr,
    data: data ? JSON.stringify(data) : null,
    read: false,
    createdAt: new Date(),
  }).returning()
  return notification
}

export async function listNotifications(userId: string, unreadOnly = false) {
  const conditions = [eq(notifications.userId, userId)]
  if (unreadOnly) conditions.push(eq(notifications.read, false))

  return db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(50)
}

export async function markNotificationRead(id: string) {
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id))
}

export async function markAllNotificationsRead(userId: string) {
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId))
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [result] = await db.select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
  return result?.count ?? 0
}

export async function createAd(data: {
  storeId: string
  title: string
  titleAr: string
  description?: string
  descriptionAr?: string
  imageUrl?: string
  targetQuery?: string
  targetCategory?: string
  budget: number
  startDate: Date
  endDate: Date
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

export async function listActiveAds(targetQuery?: string, targetCategory?: string) {
  const now = new Date()
  const conditions = [
    eq(storeAds.status, 'active'),
    lte(storeAds.startDate, now),
    gte(storeAds.endDate, now),
  ]

  if (targetQuery) {
    conditions.push(ilike(storeAds.targetQuery, `%${targetQuery}%`))
  }
  if (targetCategory) {
    conditions.push(eq(storeAds.targetCategory, targetCategory))
  }

  return db.select().from(storeAds)
    .where(and(...conditions))
    .orderBy(desc(storeAds.budget))
    .limit(10)
}

export async function recordAdImpression(adId: string) {
  await db.update(storeAds)
    .set({ impressions: sql`${storeAds.impressions} + 1` })
    .where(eq(storeAds.id, adId))
}

export async function recordAdClick(adId: string) {
  await db.update(storeAds)
    .set({ clicks: sql`${storeAds.clicks} + 1` })
    .where(eq(storeAds.id, adId))
}

export async function addLoyaltyPoints(userId: string, points: number, description: string) {
  const [existing] = await db.select().from(loyaltyPoints)
    .where(eq(loyaltyPoints.userId, userId))

  if (existing) {
    await db.update(loyaltyPoints)
      .set({
        points: sql`${loyaltyPoints.points} + ${points}`,
        totalEarned: sql`${loyaltyPoints.totalEarned} + ${points}`,
      })
      .where(eq(loyaltyPoints.userId, userId))
  } else {
    await db.insert(loyaltyPoints).values({
      id: crypto.randomUUID(),
      userId,
      points,
      totalEarned: points,
      totalRedeemed: 0,
      createdAt: new Date(),
    })
  }

  await db.insert(loyaltyTransactions).values({
    id: crypto.randomUUID(),
    userId,
    points,
    type: 'earned',
    description,
    createdAt: new Date(),
  })
}

export async function redeemLoyaltyPoints(userId: string, points: number, description: string) {
  const [existing] = await db.select().from(loyaltyPoints)
    .where(eq(loyaltyPoints.userId, userId))

  if (!existing || existing.points < points) {
    throw new Error('Insufficient points')
  }

  await db.update(loyaltyPoints)
    .set({
      points: sql`${loyaltyPoints.points} - ${points}`,
      totalRedeemed: sql`${loyaltyPoints.totalRedeemed} + ${points}`,
    })
    .where(eq(loyaltyPoints.userId, userId))

  await db.insert(loyaltyTransactions).values({
    id: crypto.randomUUID(),
    userId,
    points: -points,
    type: 'redeemed',
    description,
    createdAt: new Date(),
  })
}

export async function getLoyaltyBalance(userId: string) {
  const [balance] = await db.select().from(loyaltyPoints)
    .where(eq(loyaltyPoints.userId, userId))
  return balance?.points ?? 0
}

export async function recordBarcodeScan(userId: string | undefined, barcode: string, partId?: string) {
  const [scan] = await db.insert(barcodeScans).values({
    id: crypto.randomUUID(),
    userId,
    barcode,
    partId,
    scannedAt: new Date(),
  }).returning()
  return scan
}

export async function findPartByBarcode(barcode: string) {
  const [part] = await db.select().from(parts)
    .where(eq(parts.barcode, barcode))
  return part
}