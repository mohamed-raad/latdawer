'use client'

import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'
import { subscriptionPlans, paymentMethods } from '@/features/subscriptions/plans'

export default function SubscriptionsPage() {
  const { t } = useLanguage()
  
  const { data: subscriptions, refetch } = trpc.admin.listSubscriptions.useQuery()
  const setDiscountMutation = trpc.admin.setDiscount.useMutation({ onSuccess: () => refetch() })
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('subscriptionManagement')}</h1>
      
      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {subscriptionPlans.map((plan) => (
          <div key={plan.plan} className="rounded-xl border p-6">
            <h3 className="text-lg font-bold">{plan.nameAr}</h3>
            <p className="text-2xl font-bold mt-2">{plan.price.toLocaleString()} IQD</p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="text-sm text-muted-foreground">• {feature}</li>
              ))}
            </ul>
            <button
              className="mt-4 rounded-lg border px-4 py-2 text-sm"
            >
              {t('editPlan')}
            </button>
          </div>
        ))}
      </div>
      
      {/* Payment Methods */}
      <h2 className="text-xl font-bold mb-4">{t('paymentMethods')}</h2>
      <div className="rounded-xl border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center gap-3 p-3 rounded-lg border">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              <div>
                <p className="font-medium">{method.name}</p>
                <p className="text-sm text-muted-foreground">{method.nameEn}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Active Subscriptions */}
      <h2 className="text-xl font-bold mb-4">{t('activeSubscriptions')}</h2>
      {subscriptions && subscriptions.length > 0 ? (
        <div className="rounded-xl border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-right">{t('store')}</th>
                <th className="p-3 text-right">{t('plan')}</th>
                <th className="p-3 text-right">{t('status')}</th>
                <th className="p-3 text-right">{t('discount')}</th>
                <th className="p-3 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-b">
                  <td className="p-3">{sub.storeId?.slice(0, 12)}...</td>
                  <td className="p-3">{sub.plan}</td>
                  <td className="p-3">{sub.status}</td>
                  <td className="p-3">{sub.discount || 0}%</td>
                  <td className="p-3">
                    <button
                      onClick={() => {
                        const newDiscount = prompt(t('enterDiscount'))
                        if (newDiscount) {
                          setDiscountMutation.mutate({
                            subscriptionId: sub.id,
                            discountPercent: parseInt(newDiscount),
                          })
                        }
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      {t('setDiscount')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border p-8 text-center text-muted-foreground">
          {t('noSubscriptions')}
        </div>
      )}
    </div>
  )
}