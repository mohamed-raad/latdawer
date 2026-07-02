import { router } from './server'
import { searchRouter } from '@/features/search/router'
import { inventoryRouter } from '@/features/inventory/router'
import { storesRouter } from '@/features/stores/router'
import { vehiclesRouter } from '@/features/vehicles/router'
import { adminRouter } from '@/features/admin/router'
import { authRouter } from '@/features/auth/router'
import { partsRouter } from '@/features/parts/router'
import { alternativesRouter } from '@/features/alternatives/router'
import { reviewsRouter } from '@/features/reviews/router'
import { watchlistRouter } from '@/features/watchlist/router'
import { requestsRouter } from '@/features/requests/router'
import { garageRouter } from '@/features/garage/router'
import { aiRouter } from '@/features/ai/router'
import { featuresRouter } from '@/features/features/router'
import { agentRouter } from '@/features/agent/router'
import { advancedRouter } from '@/features/advanced/router'
import { forumRouter } from '@/features/forum/router'
import { transactionsRouter } from '@/features/transactions/router'
import { disputesRouter } from '@/features/disputes/router'
import { onboardingRouter } from '@/features/stores/onboarding-router'
import { workflowRouter } from '@/features/ai/workflow-router'

export const appRouter = router({
  search: searchRouter,
  inventory: inventoryRouter,
  stores: storesRouter,
  vehicles: vehiclesRouter,
  admin: adminRouter,
  auth: authRouter,
  parts: partsRouter,
  alternatives: alternativesRouter,
  reviews: reviewsRouter,
  watchlist: watchlistRouter,
  requests: requestsRouter,
  garage: garageRouter,
  ai: aiRouter,
  features: featuresRouter,
  agent: agentRouter,
  advanced: advancedRouter,
  forum: forumRouter,
  transactions: transactionsRouter,
  disputes: disputesRouter,
  onboarding: onboardingRouter,
  workflows: workflowRouter,
})

export type AppRouter = typeof appRouter
