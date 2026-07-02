import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '@/lib/trpc/server'
import {
  createAgent, updateAgent, deleteAgent, listAgents,
  validateAgentAccess, logAgentRequest, getAgentLogs,
  agentSearchParts, agentGetStore, agentListStores,
  agentVerifyStore, agentRejectStore, agentGetInventory,
  agentListCategories, agentListManufacturers,
  agentCreateAd, agentListAds, agentUpdateAd,
  agentGetDashboardStats, agentControlAI,
} from './services'
import { TRPCError } from '@trpc/server'

export const agentRouter = router({
  // Agent Management (Admin)
  createAgent: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      permissions: z.string().default('read'),
    }))
    .mutation(async ({ ctx, input }) => {
      return createAgent(ctx.userId!, input.name, input.description || '', input.permissions)
    }),

  listAgents: protectedProcedure.query(async ({ ctx }) => {
    return listAgents(ctx.userId!)
  }),

  updateAgent: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      permissions: z.string().optional(),
      enabled: z.boolean().optional(),
      rateLimit: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      return updateAgent(id, data)
    }),

  deleteAgent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => deleteAgent(input.id)),

  getAgentLogs: protectedProcedure
    .input(z.object({ agentId: z.string() }))
    .query(async ({ input }) => getAgentLogs(input.agentId)),

  // AI Agent API Endpoints
  agentSearch: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      query: z.string().min(1),
      filters: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ input }) => {
      const access = await validateAgentAccess(input.apiKey, 'read')
      if (!access) {
        await logAgentRequest('', '/search', 'POST', 401)
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid API key' })
      }

      const result = await agentSearchParts(input.query, input.filters)
      await logAgentRequest(access.agent.id, '/search', 'POST', 200, JSON.stringify(input), JSON.stringify(result))
      return result
    }),

  agentGetStore: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      storeId: z.string(),
    }))
    .query(async ({ input }) => {
      const access = await validateAgentAccess(input.apiKey, 'read')
      if (!access) throw new TRPCError({ code: 'UNAUTHORIZED' })
      return agentGetStore(input.storeId)
    }),

  agentListStores: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      city: z.string().optional(),
      verified: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const access = await validateAgentAccess(input.apiKey, 'read')
      if (!access) throw new TRPCError({ code: 'UNAUTHORIZED' })
      return agentListStores({ city: input.city, verified: input.verified })
    }),

  agentVerifyStore: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      storeId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const access = await validateAgentAccess(input.apiKey, 'store_management')
      if (!access) throw new TRPCError({ code: 'UNAUTHORIZED' })
      return agentVerifyStore(input.storeId)
    }),

  agentRejectStore: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      storeId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      const access = await validateAgentAccess(input.apiKey, 'store_management')
      if (!access) throw new TRPCError({ code: 'UNAUTHORIZED' })
      return agentRejectStore(input.storeId, input.reason)
    }),

  agentGetInventory: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      storeId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const access = await validateAgentAccess(input.apiKey, 'read')
      if (!access) throw new TRPCError({ code: 'UNAUTHORIZED' })
      return agentGetInventory(input.storeId)
    }),

  agentListCategories: publicProcedure
    .input(z.object({ apiKey: z.string() }))
    .query(async ({ input }) => {
      const access = await validateAgentAccess(input.apiKey, 'read')
      if (!access) throw new TRPCError({ code: 'UNAUTHORIZED' })
      return agentListCategories()
    }),

  agentListManufacturers: publicProcedure
    .input(z.object({ apiKey: z.string() }))
    .query(async ({ input }) => {
      const access = await validateAgentAccess(input.apiKey, 'read')
      if (!access) throw new TRPCError({ code: 'UNAUTHORIZED' })
      return agentListManufacturers()
    }),

  agentCreateAd: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      storeId: z.string(),
      title: z.string(),
      titleAr: z.string(),
      budget: z.number(),
      startDate: z.date(),
      endDate: z.date(),
      targetQuery: z.string().optional(),
      targetCategory: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const access = await validateAgentAccess(input.apiKey, 'ads_control')
      if (!access) throw new TRPCError({ code: 'UNAUTHORIZED' })
      const { apiKey: _, ...data } = input
      return agentCreateAd(data)
    }),

  agentListAds: publicProcedure
    .input(z.object({ apiKey: z.string() }))
    .query(async ({ input }) => {
      const access = await validateAgentAccess(input.apiKey, 'ads_control')
      if (!access) throw new TRPCError({ code: 'UNAUTHORIZED' })
      return agentListAds()
    }),

  agentUpdateAd: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      adId: z.string(),
      status: z.string().optional(),
      budget: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const access = await validateAgentAccess(input.apiKey, 'ads_control')
      if (!access) throw new TRPCError({ code: 'UNAUTHORIZED' })
      const { apiKey: _, adId, ...data } = input
      return agentUpdateAd(adId, data)
    }),

  agentGetStats: publicProcedure
    .input(z.object({ apiKey: z.string() }))
    .query(async ({ input }) => {
      const access = await validateAgentAccess(input.apiKey, 'admin')
      if (!access) throw new TRPCError({ code: 'UNAUTHORIZED' })
      return agentGetDashboardStats()
    }),

  agentControlAI: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      action: z.enum(['list_providers', 'list_models', 'get_usage']),
      params: z.record(z.string(), z.unknown()).optional(),
    }))
    .query(async ({ input }) => {
      const access = await validateAgentAccess(input.apiKey, 'ai_control')
      if (!access) throw new TRPCError({ code: 'UNAUTHORIZED' })
      return agentControlAI(input.action, input.params)
    }),
})