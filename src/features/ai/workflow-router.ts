import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '@/lib/trpc/server'
import {
  createWorkflow,
  listWorkflows,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
  runWorkflow,
  assignWorkflowToStore,
  getStoreAutomations,
  canRunAutomation,
  parseWorkflowFromText,
} from './workflow-engine'

export const workflowRouter = router({
  list: adminProcedure.query(async () => listWorkflows()),

  byId: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => getWorkflowById(input.id)),

  create: adminProcedure
    .input(z.object({
      name: z.string(),
      triggerType: z.string(),
      triggerConfig: z.record(z.unknown()).optional(),
      actions: z.array(z.object({
        type: z.string(),
        config: z.record(z.unknown()).default({}),
      })),
      conditions: z.array(z.object({
        field: z.string(),
        operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'in']),
        value: z.unknown(),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => createWorkflow(input, ctx.userId)),

  createFromText: adminProcedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const parsed = await parseWorkflowFromText(input.text)
      return createWorkflow(parsed, ctx.userId)
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      triggerType: z.string().optional(),
      triggerConfig: z.record(z.unknown()).optional(),
      actions: z.array(z.object({
        type: z.string(),
        config: z.record(z.unknown()).default({}),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      return updateWorkflow(id, data)
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => deleteWorkflow(input.id)),

  run: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      input: z.record(z.unknown()),
      storeId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const canRun = await canRunAutomation(input.storeId || '', input.workflowId)
      if (!canRun.allowed) {
        return { success: false, error: canRun.reason }
      }
      return runWorkflow(input.workflowId, input.input, input.storeId)
    }),

  assignToStore: adminProcedure
    .input(z.object({
      storeId: z.string(),
      workflowId: z.string(),
      maxPricePerAction: z.number().optional(),
      maxActionsPerDay: z.number().optional(),
      planRequired: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return assignWorkflowToStore(
        input.storeId,
        input.workflowId,
        input.maxPricePerAction,
        input.maxActionsPerDay,
        input.planRequired
      )
    }),

  getStoreAutomations: protectedProcedure
    .input(z.object({ storeId: z.string() }))
    .query(async ({ input }) => getStoreAutomations(input.storeId)),
})
