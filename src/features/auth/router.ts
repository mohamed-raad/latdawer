import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '@/lib/trpc/server'
import { signUp, signIn, getCurrentUser } from './services'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const authRouter = router({
  signUp: publicProcedure
    .mutation(async ({ input }) => signUp(input)),

  signIn: publicProcedure
    .mutation(async ({ input }) => signIn(input)),

  me: protectedProcedure
    .query(async ({ ctx }) => getCurrentUser(ctx.userId!)),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      city: z.string().optional(),
      area: z.string().optional(),
      gpsLat: z.string().optional(),
      gpsLng: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db.update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, ctx.userId!))
        .returning()
      return updated
    }),
})
