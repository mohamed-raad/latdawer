'use client'

import { useState, useCallback } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export function usePushNotifications() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  )
  const isSupported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator

  const subscribe = useCallback(async () => {
    if (!isSupported || !VAPID_PUBLIC_KEY) return null
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) })
      setSubscription(sub); setPermission('granted')
      await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: JSON.parse(JSON.stringify(sub)) }) })
      return sub
    } catch (err) { console.error('Push subscription failed:', err); return null }
  }, [isSupported])

  const unsubscribe = useCallback(async () => {
    if (!subscription) return
    try { await subscription.unsubscribe(); setSubscription(null); await fetch('/api/push/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: subscription.endpoint }) }) }
    catch (err) { console.error('Push unsubscribe failed:', err) }
  }, [subscription])

  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'denied' as NotificationPermission
    const result = await Notification.requestPermission(); setPermission(result); return result
  }, [isSupported])

  return { isSupported, permission, subscription, subscribe, unsubscribe, requestPermission }
}
