import { SignJWT, jwtVerify } from 'jose'

const CSRF_SECRET = new TextEncoder().encode(
  process.env.CSRF_SECRET || process.env.JWT_SECRET || 'fallback-csrf-secret-key-change-in-production'
)

const CSRF_TOKEN_EXPIRY = '1h'

export async function generateCSRFToken(): Promise<string> {
  return new SignJWT({ type: 'csrf' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(CSRF_TOKEN_EXPIRY)
    .sign(CSRF_SECRET)
}

export async function validateCSRFToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, CSRF_SECRET)
    return payload.type === 'csrf'
  } catch {
    return false
  }
}

export async function getCSRFTokenFromRequest(request: Request): Promise<string | null> {
  const headerToken = request.headers.get('x-csrf-token')
  if (headerToken) return headerToken

  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const match = cookieHeader.match(/csrf-token=([^;]+)/)
    if (match) return match[1]
  }

  return null
}

export function csrfProtection() {
  return async function csrfMiddleware(request: Request): Promise<Response | null> {
    if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
      return null
    }

    const token = await getCSRFTokenFromRequest(request)
    if (!token) {
      return new Response(JSON.stringify({ error: 'CSRF token missing' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const isValid = await validateCSRFToken(token)
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return null
  }
}