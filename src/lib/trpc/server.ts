import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSessionTokenFromRequest, verifySession } from '@/lib/auth/session'
import { checkRateLimit } from '@/lib/rate-limit'

export async function createTRPCContext(opts?: { req?: Request }) {
  let userId: string | undefined
  let role: string | undefined

  if (opts?.req) {
    const token = getSessionTokenFromRequest(opts.req)
    if (token) {
      const payload = await verifySession(token)
      if (payload) {
        const [user] = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, payload.userId))
        userId = payload.userId
        role = user?.role
      }
    }
  }

  return { db, userId, role, req: opts?.req }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
})

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: { ...ctx, userId: ctx.userId },
  })
})

const withRateLimit = t.middleware(async ({ ctx, next }) => {
  const ip = ctx.req?.headers?.get('x-forwarded-for') || ctx.req?.headers?.get('x-real-ip') || 'unknown'
  const result = checkRateLimit(`trpc:${ip}`)

  if (!result.allowed) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded. Please try again later.',
    })
  }

  return next()
})

export const router = t.router
export const publicProcedure = t.procedure.use(withRateLimit)
export const protectedProcedure = t.procedure.use(isAuthed).use(withRateLimit)

const isAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  if (ctx.role !== 'Admin' && ctx.role !== 'SuperAdmin') {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
  return next({
    ctx: { ...ctx, userId: ctx.userId },
  })
})

export const adminProcedure = t.procedure.use(isAdmin).use(withRateLimit)
