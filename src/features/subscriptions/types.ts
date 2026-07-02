export type SubscriptionPlan = 'basic' | 'premium' | 'enterprise'
export type PaymentMethod = 'cash' | 'zain_cash' | 'qi_card' | 'fast_pay' | 'bank_transfer'

export interface Subscription {
  id: string
  storeId: string
  plan: SubscriptionPlan
  status: 'active' | 'pending' | 'cancelled'
  paymentMethod: PaymentMethod
  amount: number
  discount: number
  startDate: Date
  endDate: Date
}

export interface SubscriptionPlanDetails {
  plan: SubscriptionPlan
  name: string
  nameAr: string
  price: number
  features: string[]
  inventoryLimit: number
}