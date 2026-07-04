import { NextRequest, NextResponse } from 'next/server'

const subscriptions = new Map<string, { endpoint: string; keys: Record<string, string> }>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscription } = body
    if (!subscription?.endpoint) return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    subscriptions.set(subscription.endpoint, { endpoint: subscription.endpoint, keys: subscription.keys || {} })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 }) }
}

export async function DELETE(request: NextRequest) {
  try { const { endpoint } = await request.json(); subscriptions.delete(endpoint); return NextResponse.json({ success: true }) }
  catch { return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 }) }
}

export async function sendPushNotification(_userId: string, title: string, body: string, url?: string) {
  for (const [endpoint] of Array.from(subscriptions.entries())) {
    try { await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: JSON.stringify({ title, body, url }) }) }
    catch { subscriptions.delete(endpoint) }
  }
}
