import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { signUpSchema, signInSchema } from './validators'
import type { SessionUser } from './types'
import { logSecurityEvent } from '@/lib/security-logger'

export async function signUp(data: unknown) {
  const input = signUpSchema.parse(data)

  logSecurityEvent({ event: 'signup_attempt', details: { email: input.email } })

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))

  if (existing.length > 0) {
    logSecurityEvent({ event: 'signup_attempt', details: { email: input.email, reason: 'email_exists' } })
    throw new TRPCError({
      code: 'CONFLICT',
      message: 'البريد الإلكتروني مسجل مسبقاً',
    })
  }

  const passwordHash = await hashPassword(input.password)
  const now = new Date()

  const [user] = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      email: input.email,
      passwordHash,
      name: input.name,
      role: input.role,
      phone: input.phone,
      city: input.city,
      area: input.area,
      gpsLat: input.gpsLat,
      gpsLng: input.gpsLng,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  logSecurityEvent({ event: 'signup_success', userId: user.id, details: { email: input.email, role: input.role } })

  const sessionToken = await createSession({
    userId: user.id,
    role: user.role,
    email: user.email,
  })

  return { sessionToken }
}

export async function signIn(data: unknown) {
  const input = signInSchema.parse(data)

  logSecurityEvent({ event: 'login_attempt', details: { email: input.email } })

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))

  if (!user) {
    logSecurityEvent({ event: 'login_failure', details: { email: input.email, reason: 'user_not_found' } })
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    })
  }

  const valid = await verifyPassword(input.password, user.passwordHash)
  if (!valid) {
    logSecurityEvent({ event: 'login_failure', userId: user.id, details: { email: input.email, reason: 'invalid_password' } })
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    })
  }

  logSecurityEvent({ event: 'login_success', userId: user.id, details: { email: input.email } })

  const sessionToken = await createSession({
    userId: user.id,
    role: user.role,
    email: user.email,
  })

  return { sessionToken }
}

export async function getCurrentUser(userId: string): Promise<SessionUser> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      city: users.city,
      phone: users.phone,
    })
    .from(users)
    .where(eq(users.id, userId))

  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'المستخدم غير موجود',
    })
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as SessionUser['role'],
    city: user.city,
    phone: user.phone,
  }
}
