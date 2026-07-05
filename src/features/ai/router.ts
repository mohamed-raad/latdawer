import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc/server'
import {
  createProvider, updateProvider, deleteProvider, listProviders,
  createModel, updateModel, deleteModel, listModels,
  fetchModelsFromProvider,
  createConversation, listConversations, getConversation,
  addMessage, getMessages, addPhotoSuggestion, updatePhotoStatus,
  getPhotoSuggestions, getSystemPrompt, checkUsageLimit, recordUsage,
  addKnowledgeEntry, getKnowledgeBase,
  generateAIResponse,
  getProviderApiKey,
} from './services'
import { db } from '@/db'
import { aiProviders } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

const isAdmin = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.role !== 'Admin' && ctx.role !== 'SuperAdmin') {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
  return next()
})

export const aiRouter = router({
  // ─── Provider Management ───

  listProviders: isAdmin.query(async () => listProviders()),

  createProvider: isAdmin
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      apiEndpoint: z.string().url(),
      apiKey: z.string().optional(),
    }))
    .mutation(async ({ input }) => createProvider(input)),

  updateProvider: isAdmin
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      apiEndpoint: z.string().url().optional(),
      apiKey: z.string().optional(),
      enabled: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      return updateProvider(id, data)
    }),

  deleteProvider: isAdmin
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => deleteProvider(input.id)),

  testProviderKey: isAdmin
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const apiKey = await getProviderApiKey(input.id)
      if (!apiKey) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No API key configured' })
      }

      const [provider] = await db.select().from(aiProviders).where(eq(aiProviders.id, input.id))

      if (!provider) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      try {
        await fetchModelsFromProvider(provider.slug, apiKey)
        return { success: true, message: 'API key is valid' }
      } catch (error) {
        return { success: false, message: (error as Error).message }
      }
    }),

  // ─── Model Management ───

  listModels: isAdmin
    .input(z.object({ providerId: z.string().optional() }))
    .query(async ({ input }) => listModels(input.providerId)),

  createModel: isAdmin
    .input(z.object({
      providerId: z.string(),
      modelId: z.string().min(1),
      name: z.string().min(1),
      maxTokens: z.number().optional(),
      costPer1kTokens: z.number().optional(),
    }))
    .mutation(async ({ input }) => createModel(input)),

  updateModel: isAdmin
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      maxTokens: z.number().optional(),
      enabled: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      return updateModel(id, data)
    }),

  deleteModel: isAdmin
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => deleteModel(input.id)),

  fetchModels: isAdmin
    .input(z.object({
      providerId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const apiKey = await getProviderApiKey(input.providerId)
      if (!apiKey) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No API key configured for this provider' })
      }

      const [provider] = await db.select().from(aiProviders).where(eq(aiProviders.id, input.providerId))

      if (!provider) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      try {
        const models = await fetchModelsFromProvider(provider.slug, apiKey)
        return { models }
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Failed to fetch models: ${(error as Error).message}`,
        })
      }
    }),

  // ─── Chat ───

  listConversations: protectedProcedure.query(async ({ ctx }) => {
    return listConversations(ctx.userId!)
  }),

  createConversation: protectedProcedure
    .input(z.object({ title: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return createConversation(ctx.userId!, undefined, input.title)
    }),

  getConversation: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => getConversation(input.id)),

  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ input }) => getMessages(input.conversationId)),

  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      content: z.string().min(1),
      modelId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { conversationId, content, modelId } = input

        const conversation = await getConversation(conversationId)
        if (!conversation || conversation.userId !== ctx.userId) {
          throw new TRPCError({ code: 'NOT_FOUND' })
        }

        const hasLimit = await checkUsageLimit(ctx.userId!, 50)
        if (!hasLimit) {
          throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Usage limit exceeded' })
        }

        await addMessage(conversationId, 'user', content)

        const systemPrompt = await getSystemPrompt()

        const aiResponse = await generateAIResponse(systemPrompt, content, conversationId, modelId)

        const aiMessage = await addMessage(conversationId, 'assistant', aiResponse.content, {
          model: aiResponse.model,
          tokensUsed: aiResponse.tokensUsed,
          modelId: modelId || null,
        })

        if (aiResponse.photoSearches && aiResponse.photoSearches.length > 0) {
          for (const photo of aiResponse.photoSearches) {
            await addPhotoSuggestion(aiMessage.id, photo.url, photo.source, photo.searchTerm)
          }
        }

        await recordUsage(ctx.userId!, modelId || 'default', aiResponse.tokensUsed || 0)

        return {
          message: aiMessage,
          photos: aiResponse.photoSearches || [],
        }
      } catch (error) {
        console.error('sendMessage error:', error)
        throw error
      }
    }),

  getPhotoSuggestions: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .query(async ({ input }) => getPhotoSuggestions(input.messageId)),

  updatePhotoStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['accepted', 'rejected']),
    }))
    .mutation(async ({ input }) => updatePhotoStatus(input.id, input.status)),

  // ─── Knowledge Base ───

  addKnowledge: isAdmin
    .input(z.object({
      term: z.string().min(1),
      translation: z.string().min(1),
      category: z.string().optional(),
    }))
    .mutation(async ({ input }) => addKnowledgeEntry(input.term, input.translation, input.category)),

  getKnowledgeBase: isAdmin.query(async () => getKnowledgeBase()),
})
