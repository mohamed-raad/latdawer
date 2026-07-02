import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionTokenFromRequest, verifySession } from '@/lib/auth/session'
import { validateCSRFToken } from '@/lib/csrf'
import { addSecurityHeaders, detectSQLInjection, detectXSS } from '@/lib/security-middleware'

const protectedRoutes = ['/dashboard', '/admin']
const publicRoutes = ['/login', '/signup', '/forgot-password']
const csrfProtectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Input validation for query parameters
  const searchParams = req.nextUrl.searchParams
  for (const [, value] of searchParams.entries()) {
    if (detectSQLInjection(value) || detectXSS(value)) {
      return NextResponse.json(
        { error: 'Invalid input detected' },
        { status: 400 }
      )
    }
  }

  // CSRF protection for mutation requests
  if (csrfProtectedMethods.includes(req.method)) {
    const isApiRoute = pathname.startsWith('/api/')
    const isTrpcRoute = pathname.startsWith('/api/trpc/')

    if (isApiRoute || isTrpcRoute) {
      const csrfToken = req.headers.get('x-csrf-token') ||
        req.cookies.get('csrf-token')?.value

      if (csrfToken) {
        const isValid = await validateCSRFToken(csrfToken)
        if (!isValid) {
          return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
          )
        }
      }
    }
  }

  const token = getSessionTokenFromRequest(req)
  let isAuthed = false

  if (token) {
    const payload = await verifySession(token)
    isAuthed = !!payload
  }

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r))
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r))

  if (isProtected && !isAuthed) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthed && isPublic) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)',
  ],
}
