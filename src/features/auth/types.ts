export type Role = 'Customer' | 'StoreManager' | 'Admin' | 'SuperAdmin'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
  city: string | null
  phone: string | null
}
