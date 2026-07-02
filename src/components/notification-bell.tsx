'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data: unreadCount, refetch: refetchCount } = trpc.features.getUnreadCount.useQuery()
  const { data: notifications, refetch: refetchNotifications } = trpc.features.listNotifications.useQuery(
    { unreadOnly: false },
    { enabled: open }
  )

  const markReadMutation = trpc.features.markNotificationRead.useMutation({
    onSuccess: () => { refetchCount(); refetchNotifications() }
  })

  const markAllReadMutation = trpc.features.markAllNotificationsRead.useMutation({
    onSuccess: () => { refetchCount(); refetchNotifications() }
  })

  const typeIcons: Record<string, string> = {
    price_drop: '💰',
    new_inventory: '📦',
    order_update: '🛒',
    promotion: '🎉',
    system: '🔔',
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 hover:bg-muted transition-colors"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {(unreadCount ?? 0) > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount! > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b p-3">
            <h3 className="font-bold text-sm">الإشعارات</h3>
            {(unreadCount ?? 0) > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                قراءة الكل
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-auto">
            {notifications && notifications.length > 0 ? (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markReadMutation.mutate({ id: n.id })}
                  className={`w-full text-right p-3 border-b last:border-0 hover:bg-muted transition-colors ${
                    !n.read ? 'bg-muted/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{typeIcons[n.type] || '🔔'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{n.titleAr}</p>
                      <p className="text-xs text-muted-foreground truncate">{n.messageAr}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.createdAt).toLocaleDateString('ar-IQ')}
                      </p>
                    </div>
                    {!n.read && <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">لا توجد إشعارات</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}