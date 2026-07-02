import Link from 'next/link'
import { CONDITION_LABELS, CONDITION_COLORS } from '@/constants'

interface InventoryItem {
  inventory: {
    id: string
    partId: string
    price: number
    quantity: number
    condition: string
  }
  part: {
    nameAr: string | null
    nameEn: string | null
    partNumber: string | null
  } | null
}

interface InventoryTableProps {
  inventory: InventoryItem[]
  isLoading: boolean
}

export function InventoryTable({ inventory, isLoading }: InventoryTableProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (inventory.length === 0) {
    return (
      <div className="rounded-xl border p-8 text-center text-muted-foreground">
        لا توجد قطع متوفرة حالياً في هذا المتجر
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted text-right">
            <th className="p-3 font-medium">اسم القطعة</th>
            <th className="p-3 font-medium">رقم القطعة</th>
            <th className="p-3 font-medium">السعر</th>
            <th className="p-3 font-medium">الكمية</th>
            <th className="p-3 font-medium">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => (
            <tr key={item.inventory.id} className="border-b last:border-0 hover:bg-muted/50">
              <td className="p-3">
                <Link href={`/parts/${item.inventory.partId}`} className="font-medium hover:underline">
                  {item.part?.nameAr || item.part?.nameEn || '—'}
                </Link>
              </td>
              <td className="p-3 text-muted-foreground" dir="ltr">
                {item.part?.partNumber || '—'}
              </td>
              <td className="p-3 font-bold" dir="rtl">
                {item.inventory.price.toLocaleString()} د.ع
              </td>
              <td className="p-3">{item.inventory.quantity}</td>
              <td className="p-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONDITION_COLORS[item.inventory.condition] ?? 'bg-gray-100 text-gray-800'}`}
                >
                  {CONDITION_LABELS[item.inventory.condition] ?? item.inventory.condition}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}