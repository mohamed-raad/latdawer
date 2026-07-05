import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const testUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Toyota_logo.svg/512px-Toyota_logo.svg.png'
    const res = await fetch(testUrl)
    return NextResponse.json({ ok: res.ok, status: res.status, type: res.headers.get('content-type') })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' })
  }
}
