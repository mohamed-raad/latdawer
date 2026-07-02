import { SignJWT, jwtVerify } from 'jose'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth/password'

const RESET_SECRET = new TextEncoder().encode(
  process.env.RESET_SECRET || process.env.JWT_SECRET || 'fallback-reset-secret-key-change-in-production'
)

const RESET_TOKEN_EXPIRY = '1h'

export async function generateResetToken(email: string): Promise<string | null> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (!user) return null

  return new SignJWT({ userId: user.id, type: 'reset' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(RESET_TOKEN_EXPIRY)
    .sign(RESET_SECRET)
}

export async function validateResetToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, RESET_SECRET)
    if (payload.type === 'reset' && payload.userId) {
      return { userId: payload.userId as string }
    }
    return null
  } catch {
    return null
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const result = await validateResetToken(token)
  if (!result) return false

  const passwordHash = await hashPassword(newPassword)
  await db.update(users).set({ passwordHash }).where(eq(users.id, result.userId))

  return true
}