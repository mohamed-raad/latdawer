import { NextResponse } from 'next/server'
import { signIn } from '@/features/auth/services'
import { COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth/config'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { sessionToken } = await signIn(body)
    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
    return response
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 400 }
    )
  }
}
