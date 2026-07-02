import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { JWT_SECRET, COOKIE_NAME } from './config'

export interface SessionPayload extends JWTPayload {
  userId: string
  role: string
  email: string
}

export async function createSession(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET)
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as SessionPayload
  } catch {
    return null
  }
}

export function getSessionTokenFromRequest(req: Request): string | null {
  const cookie = req.headers.get('cookie') || ''
  for (const c of cookie.split(';')) {
    const [name, ...rest] = c.trim().split('=')
    if (name === COOKIE_NAME) {
      return rest.join('=').trim()
    }
  }
  return null
}

export async function getSessionFromRequest(
  req: Request
): Promise<SessionPayload | null> {
  const token = getSessionTokenFromRequest(req)
  if (!token) return null
  return verifySession(token)
}
