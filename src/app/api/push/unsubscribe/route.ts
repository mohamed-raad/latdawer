import { NextRequest, NextResponse } from 'next/server'

const subscriptions = new Map<string, { endpoint: string; keys: Record<string, string> }>()

export async function POST(request: NextRequest) {
  try { const { endpoint } = await request.json(); subscriptions.delete(endpoint); return NextResponse.json({ success: true }) }
  catch { return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 }) }
}
