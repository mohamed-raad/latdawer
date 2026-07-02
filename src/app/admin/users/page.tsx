'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import type { Role } from '@/features/auth/types'

const roles: Role[] = ['Customer', 'StoreManager', 'Admin', 'SuperAdmin']

const roleLabels: Record<Role, string> = {
  Customer: 'مستخدم عادي',
  StoreManager: 'صاحب متجر',
  Admin: 'مدير',
  SuperAdmin: 'مدير عام',
}

export default function UsersPage() {
  const { data, isLoading, refetch } = trpc.admin.users.useQuery({ page: 1, limit: 50 })
  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => refetch(),
  })
  const [message, setMessage] = useState<string | null>(null)

  function handleRoleChange(userId: string, role: Role) {
    setMessage(`تم تحديث دور المستخدم`)
    updateRole.mutate({ userId, role })
    setTimeout(() => setMessage(null), 3000)
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">المستخدمين</h1>
        <div className="rounded-xl border p-12 text-center text-muted-foreground">
          جارٍ التحميل...
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">المستخدمين</h1>
      {message && (
        <div className="mb-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 p-3 text-sm text-green-800 dark:text-green-200">
          {message}
        </div>
      )}
      {!data || data.results.length === 0 ? (
        <div className="rounded-xl border p-12 text-center text-muted-foreground">
          لا يوجد مستخدمين
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-right p-3 font-medium">الاسم</th>
                <th className="text-right p-3 font-medium">البريد الإلكتروني</th>
                <th className="text-right p-3 font-medium">المدينة</th>
                <th className="text-right p-3 font-medium">الدور</th>
                <th className="text-right p-3 font-medium">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="p-3">{user.name}</td>
                  <td className="p-3 text-muted-foreground">{user.email}</td>
                  <td className="p-3 text-muted-foreground">{user.city || '—'}</td>
                  <td className="p-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                      className="rounded-lg border px-2 py-1 text-sm bg-background"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {roleLabels[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('ar-IQ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
