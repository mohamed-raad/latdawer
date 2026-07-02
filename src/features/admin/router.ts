import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '@/lib/trpc/server'
import { createCategorySchema, createManufacturerSchema, updateUserRoleSchema } from './validators'
import {
  dashboardStats,
  listUsers,
  changeUserRole,
  approveStore,
  addCategory,
  addManufacturer,
  auditLogsService,
  analyticsService,
} from './services'

const isAdmin = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.role !== 'Admin' && ctx.role !== 'SuperAdmin') {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
  return next()
})

export const adminRouter = router({
  stats: isAdmin.query(async () => dashboardStats()),

  users: isAdmin
    .input(z.object({ page: z.number().optional(), limit: z.number().optional() }))
    .query(async ({ input }) => listUsers(input)),

  updateUserRole: isAdmin
    .input(updateUserRoleSchema)
    .mutation(async ({ input }) => changeUserRole(input)),

  verifyStore: isAdmin
    .input(z.object({ storeId: z.string() }))
    .mutation(async ({ input }) => approveStore(input.storeId)),

  rejectStore: isAdmin
    .input(z.object({ storeId: z.string(), reason: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const { rejectStore } = await import('./services')
      return rejectStore(input.storeId, input.reason)
    }),

  createCategory: isAdmin
    .input(createCategorySchema)
    .mutation(async ({ input }) => addCategory(input)),

  createManufacturer: isAdmin
    .input(createManufacturerSchema)
    .mutation(async ({ input }) => addManufacturer(input)),

  listCategories: isAdmin.query(async () => {
    const { listCategories } = await import('./services')
    return listCategories()
  }),

  updateCategory: isAdmin
    .input(z.object({ id: z.string(), name: z.string().min(1), nameAr: z.string().min(1), slug: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const { updateCategory } = await import('./services')
      return updateCategory(input.id, input)
    }),

  deleteCategory: isAdmin
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { deleteCategory } = await import('./services')
      return deleteCategory(input.id)
    }),

  listManufacturers: isAdmin.query(async () => {
    const { listManufacturers } = await import('./services')
    return listManufacturers()
  }),

  updateManufacturer: isAdmin
    .input(z.object({ id: z.string(), name: z.string().min(1), nameAr: z.string().min(1), slug: z.string().min(1), country: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { updateManufacturer } = await import('./services')
      return updateManufacturer(input.id, input)
    }),

  deleteManufacturer: isAdmin
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { deleteManufacturer } = await import('./services')
      return deleteManufacturer(input.id)
    }),

  auditLogs: isAdmin
    .input(z.object({ page: z.number().optional(), limit: z.number().optional() }))
    .query(async ({ input }) => auditLogsService(input)),

  analytics: isAdmin.query(async () => analyticsService()),

  listSubscriptions: isAdmin.query(async () => {
    const { listSubscriptions } = await import('./services')
    return listSubscriptions()
  }),

  updateSubscriptionPlan: isAdmin
    .input(z.object({
      plan: z.enum(['basic', 'premium', 'enterprise']),
      price: z.number().positive(),
      features: z.array(z.string()),
      inventoryLimit: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { updateSubscriptionPlan } = await import('./services')
      return updateSubscriptionPlan(input)
    }),

  setDiscount: isAdmin
    .input(z.object({
      subscriptionId: z.string(),
      discountPercent: z.number().min(0).max(100),
    }))
    .mutation(async ({ input }) => {
      const { setDiscount } = await import('./services')
      return setDiscount(input.subscriptionId, input.discountPercent)
    }),

  configurePaymentMethods: isAdmin
    .input(z.object({
      methods: z.array(z.enum(['cash', 'zain_cash', 'qi_card', 'fast_pay', 'bank_transfer'])),
      enabled: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const { configurePaymentMethods } = await import('./services')
      return configurePaymentMethods(input.methods, input.enabled)
    }),
})
