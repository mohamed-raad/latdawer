import { NextResponse } from 'next/server'
import { getSessionTokenFromRequest, verifySession } from '@/lib/auth/session'
import { getCurrentUser } from '@/features/auth/services'

export async function GET(req: Request) {
  try {
    const token = getSessionTokenFromRequest(req)
    if (!token) {
      return NextResponse.json({ user: null })
    }

    const payload = await verifySession(token)
    if (!payload) {
      return NextResponse.json({ user: null })
    }

    const user = await getCurrentUser(payload.userId)
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ user: null })
  }
}
