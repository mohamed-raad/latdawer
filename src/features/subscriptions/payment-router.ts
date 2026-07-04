import { z } from 'zod'
import { router, protectedProcedure, publicProcedure } from '@/lib/trpc/server'
import { createPayment, updatePaymentStatus, getPaymentById, getPaymentsByStore, createStripeCheckoutSession, handleStripeWebhook } from './payment-service'
import { subscriptionPlans } from './plans'

export const paymentRouter = router({
  createCheckout: protectedProcedure
    .input(z.object({ plan: z.enum(['basic', 'premium', 'enterprise']), method: z.enum(['stripe', 'zain_cash', 'qi_card', 'fast_pay', 'bank_transfer', 'cash']) }))
    .mutation(async ({ input, ctx }) => {
      const plan = subscriptionPlans.find((p) => p.plan === input.plan)
      if (!plan) throw new Error('Invalid plan')
      if (input.method === 'stripe') {
        const session = await createStripeCheckoutSession(ctx.userId, plan.nameAr, plan.price,
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://latdawer.mr991199.workers.dev'}/dashboard/settings?payment=success`,
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://latdawer.mr991199.workers.dev'}/dashboard/settings?payment=cancelled`)
        await createPayment({ storeId: ctx.userId, amount: plan.price, method: 'stripe', stripeSessionId: session.id, metadata: { plan: input.plan } })
        return { url: session.url }
      }
      const payment = await createPayment({ storeId: ctx.userId, amount: plan.price, method: input.method, metadata: { plan: input.plan, manualVerification: true } })
      return { paymentId: payment.id, status: 'pending', method: input.method }
    }),
  list: protectedProcedure.query(async ({ ctx }) => getPaymentsByStore(ctx.userId)),
  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => getPaymentById(input.id)),
  webhook: publicProcedure.input(z.object({ type: z.string(), data: z.object({ object: z.object({ metadata: z.record(z.string()).optional(), payment_intent: z.string().optional(), id: z.string().optional() }) }) }))
    .mutation(async ({ input }) => handleStripeWebhook(input as Parameters<typeof handleStripeWebhook>[0])),
  confirmManual: protectedProcedure.input(z.object({ paymentId: z.string() })).mutation(async ({ input }) => updatePaymentStatus(input.paymentId, 'completed')),
})
