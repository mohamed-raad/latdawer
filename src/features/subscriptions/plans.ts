import type { SubscriptionPlanDetails } from './types'

export const subscriptionPlans: SubscriptionPlanDetails[] = [
  {
    plan: 'basic',
    name: 'Basic',
    nameAr: 'أساسي',
    price: 50000,
    features: ['100 صنف', 'بحث أساسي', 'ملف المتجر'],
    inventoryLimit: 100,
  },
  {
    plan: 'premium',
    name: 'Premium',
    nameAr: 'مميز',
    price: 150000,
    features: ['500 صنف', 'بحث أولوية', 'إحصائيات', 'صور متعددة'],
    inventoryLimit: 500,
  },
  {
    plan: 'enterprise',
    name: 'Enterprise',
    nameAr: 'مؤسسات',
    price: 500000,
    features: ['أصناف غير محدودة', 'بحث أولوي', 'إحصائيات متقدمة', 'وصول API'],
    inventoryLimit: Infinity,
  },
]

export const paymentMethods = [
  { id: 'cash', name: 'نقدي', nameEn: 'Cash on Delivery' },
  { id: 'zain_cash', name: 'زين كاش', nameEn: 'Zain Cash' },
  { id: 'qi_card', name: 'كرت qi', nameEn: 'Qi Card' },
  { id: 'fast_pay', name: 'فاست باي', nameEn: 'Fast Pay' },
  { id: 'bank_transfer', name: 'تحويل بنكي', nameEn: 'Bank Transfer' },
]