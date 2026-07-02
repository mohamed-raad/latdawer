import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '@/lib/trpc/server'
import * as svc from './services'

export const requestsRouter = router({
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().max(1000).optional(),
      partNumber: z.string().max(100).optional(),
      vehicleMake: z.string().max(100).optional(),
      vehicleModel: z.string().max(100).optional(),
      vehicleYear: z.string().max(10).optional(),
      city: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => svc.createRequest(ctx.userId, input)),

  list: protectedProcedure
    .input(z.object({ page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(50).default(20), status: z.string().optional(), city: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => svc.listRequests(input ?? {}, ctx.userId)),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => svc.getRequest(input.id)),

  offers: publicProcedure
    .input(z.object({ requestId: z.string() }))
    .query(async ({ input }) => svc.getOffers(input.requestId)),

  makeOffer: protectedProcedure
    .input(z.object({ requestId: z.string(), price: z.number().positive().optional(), notes: z.string().max(500).optional() }))
    .mutation(async ({ input, ctx }) => svc.createOffer(ctx.userId, input)),

  respondToOffer: protectedProcedure
    .input(z.object({ offerId: z.string(), status: z.enum(['accepted', 'rejected']) }))
    .mutation(async ({ input, ctx }) => svc.respondToOffer(ctx.userId, input)),

  pendingInCity: protectedProcedure
    .input(z.object({ city: z.string(), page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ input }) => svc.listRequests({ ...input, status: 'open' })),
})
