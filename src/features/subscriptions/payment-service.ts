import { db } from '@/db'
import { payments } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export interface PaymentData {
  storeId: string; amount: number; currency?: string; method: string
  subscriptionId?: string; stripePaymentId?: string; stripeSessionId?: string
  metadata?: Record<string, unknown>
}

export async function createPayment(data: PaymentData) {
  const [payment] = await db.insert(payments).values({
    id: crypto.randomUUID(), storeId: data.storeId, subscriptionId: data.subscriptionId || null,
    amount: data.amount, currency: data.currency || 'IQD', method: data.method,
    stripePaymentId: data.stripePaymentId || null, stripeSessionId: data.stripeSessionId || null,
    status: 'pending', metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    createdAt: new Date(), updatedAt: new Date(),
  }).returning()
  return payment
}

export async function updatePaymentStatus(id: string, status: string, stripePaymentId?: string) {
  const updateData: Record<string, unknown> = { status, updatedAt: new Date() }
  if (stripePaymentId) updateData.stripePaymentId = stripePaymentId
  const [payment] = await db.update(payments).set(updateData).where(eq(payments.id, id)).returning()
  return payment
}

export async function getPaymentById(id: string) {
  const [payment] = await db.select().from(payments).where(eq(payments.id, id))
  return payment
}

export async function getPaymentsByStore(storeId: string) {
  return db.select().from(payments).where(eq(payments.storeId, storeId)).orderBy(desc(payments.createdAt))
}

export async function createStripeCheckoutSession(storeId: string, planName: string, amount: number, successUrl: string, cancelUrl: string) {
  const stripe = await import('stripe').then(m => m.default)
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-12-18.acacia' })
  const session = await stripeInstance.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price_data: { currency: 'iqd', product_data: { name: `${planName} - Latdawer` }, unit_amount: amount }, quantity: 1 }],
    mode: 'payment', success_url: successUrl, cancel_url: cancelUrl,
    metadata: { storeId, plan: planName },
  })
  return session
}

export async function handleStripeWebhook(event: { type: string; data: { object: { metadata?: { storeId?: string }; payment_intent?: string; id?: string } } }) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    if (session.metadata?.storeId) {
      const [pendingPayment] = await db.select().from(payments).where(eq(payments.stripeSessionId, session.id)).limit(1)
      if (pendingPayment) await updatePaymentStatus(pendingPayment.id, 'completed', session.payment_intent || undefined)
    }
  }
  return { received: true }
}
