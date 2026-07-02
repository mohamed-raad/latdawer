'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { useSession } from '@/hooks/use-session'
import CartButton, { addToCart } from '@/components/cart-button'
import { CONDITION_LABELS, CONDITION_COLORS } from '@/constants'

const ALT_TYPE_LABELS: Record<string, string> = {
  equivalent: 'بديل مطابق',
  oem: 'أصلي',
  aftermarket: 'بديل',
}

const ALT_TYPE_COLORS: Record<string, string> = {
  equivalent: 'bg-blue-100 text-blue-800',
  oem: 'bg-green-100 text-green-800',
  aftermarket: 'bg-amber-100 text-amber-800',
}

export default function PartDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { user } = useSession()

  const { data: part, isLoading: partLoading } = trpc.parts.byId.useQuery({ id })
  const { data: inventoryData, isLoading: invLoading } = trpc.inventory.byPart.useQuery({ partId: id })
  const { data: vehiclesData, isLoading: vehLoading } = trpc.vehicles.vehiclesByPart.useQuery({ partId: id })
  const { data: alternativesData } = trpc.alternatives.byPart.useQuery({ partId: id })
  const { data: watchData, refetch: refetchWatch } = trpc.watchlist.check.useQuery(
    { partId: id },
    { enabled: !!user }
  )
  const watchAdd = trpc.watchlist.add.useMutation({
    onSuccess: () => refetchWatch(),
  })
  const watchRemove = trpc.watchlist.remove.useMutation({
    onSuccess: () => refetchWatch(),
  })

  const isLoading = partLoading || invLoading || vehLoading

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    )
  }

  if (!part) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-muted-foreground">القطعة غير موجودة</p>
        <Link href="/search" className="mt-4 inline-block text-sm font-medium hover:underline">
          &larr; العودة للبحث
        </Link>
      </div>
    )
  }

  const displayCondition = part.condition ? CONDITION_LABELS[part.condition] ?? part.condition : null
  const conditionColor = part.condition ? CONDITION_COLORS[part.condition] ?? '' : ''

  return (
    <div className="mx-auto max-w-4xl px-4 py-6" dir="rtl">
      <Link href="/search" className="text-sm text-muted-foreground hover:underline">
        &larr; العودة للنتائج
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="flex h-64 items-center justify-center rounded-xl bg-muted text-muted-foreground text-lg">
          صورة القطعة
        </div>

        <div>
          <div className="flex items-start gap-3">
            <h1 className="text-2xl font-bold">{part.nameAr}</h1>
            {displayCondition && (
              <span className={`mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${conditionColor}`}>
                {displayCondition}
              </span>
            )}
          </div>
          <p className="text-lg text-muted-foreground">{part.nameEn}</p>

          <div className="mt-4 space-y-2 text-sm">
            <p>
              <span className="font-medium">رقم القطعة:</span>{' '}
              <span dir="ltr" className="inline-block">{part.partNumber}</span>
            </p>
            {part.oemNumber && (
              <p>
                <span className="font-medium">رقم OEM:</span>{' '}
                <span dir="ltr" className="inline-block">{part.oemNumber}</span>
              </p>
            )}
            {part.brand && <p><span className="font-medium">العلامة التجارية:</span> {part.brand}</p>}
            {part.manufacturer?.nameAr && (
              <p><span className="font-medium">الشركة المصنعة:</span> {part.manufacturer.nameAr}</p>
            )}
            {part.category?.nameAr && (
              <p><span className="font-medium">التصنيف:</span> {part.category.nameAr}</p>
            )}
          </div>

          {(part.descriptionAr || part.description) && (
            <p className="mt-4 text-sm leading-relaxed">{part.descriptionAr ?? part.description}</p>
          )}

          {user && (
            <div className="mt-4">
              {watchData?.watching ? (
                <button
                  onClick={() => watchRemove.mutate({ partId: id })}
                  disabled={watchRemove.isPending}
                  className="rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                >
                  جاري المراقبة - إلغاء
                </button>
              ) : (
                <button
                  onClick={() => watchAdd.mutate({ partId: id })}
                  disabled={watchAdd.isPending}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  🔔 مراقبة السعر
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {alternativesData && alternativesData.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-xl font-bold">قطع بديلة</h2>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alternativesData.map((alt) => (
              <Link
                key={alt.id}
                href={`/parts/${alt.altPart.id}`}
                className="rounded-xl border p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm">{alt.altPart.nameAr}</p>
                    <p className="text-xs text-muted-foreground">{alt.altPart.brand || alt.altPart.nameEn}</p>
                    <p className="mt-1 text-xs text-muted-foreground" dir="ltr">{alt.altPart.partNumber}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${ALT_TYPE_COLORS[alt.type] || ''}`}>
                    {ALT_TYPE_LABELS[alt.type] || alt.type}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 flex items-start gap-3">
        <h2 className="text-xl font-bold mb-3">المتاجر المتوفرة لديها القطعة</h2>
        <Link href={`/compare?partId=${id}`} className="mt-1 rounded-lg border px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50">
          قارن الأسعار
        </Link>
      </div>

      {!inventoryData || inventoryData.length === 0 ? (
        <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
          لا توجد متاجر تبيع هذه القطعة حالياً
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-right">
                <th className="p-3 font-medium">المتجر</th>
                <th className="p-3 font-medium">السعر</th>
                <th className="p-3 font-medium">الكمية</th>
                <th className="p-3 font-medium">الحالة</th>
                <th className="p-3 font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {inventoryData.map((entry) => {
                const condLabel = CONDITION_LABELS[entry.condition] ?? entry.condition
                const condColor = CONDITION_COLORS[entry.condition] ?? ''
                const waMsg = encodeURIComponent(
                  `السلام عليكم، أود الاستفسار عن قطعة ${part.nameAr} (${part.partNumber}) المتوفرة لديكم بسعر ${entry.price} د.ع.`
                )
                return (
                  <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3">
                      <Link href={`/stores/${entry.storeId}`} className="font-medium hover:underline">
                        {entry.store.nameAr ?? entry.store.name}
                      </Link>
                      {entry.store.city && (
                        <p className="text-xs text-muted-foreground">{entry.store.city}</p>
                      )}
                    </td>
                    <td className="p-3">
                      <p className="font-bold">{entry.price.toLocaleString()} د.ع</p>
                      {entry.installationPrice && <p className="text-xs text-muted-foreground">التركيب: +{entry.installationPrice.toLocaleString()} د.ع</p>}
                    </td>
                    <td className="p-3">{entry.quantity}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${condColor}`}>
                        {condLabel}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() =>
                            addToCart({
                              partId: id,
                              partName: part.nameAr,
                              partNumber: part.partNumber ?? '',
                              storeId: entry.storeId,
                              storeName: entry.store.nameAr ?? entry.store.name,
                              storeWhatsapp: entry.store.whatsapp ?? '',
                              storePhone: entry.store.phone ?? '',
                              price: entry.price,
                            })
                          }
                          className="inline-flex items-center rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          أضف إلى السلة
                        </button>
                        {entry.store.whatsapp && (
                          <a
                            href={`https://wa.me/${entry.store.whatsapp}?text=${waMsg}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
                          >
                            واتساب
                          </a>
                        )}
                        {entry.store.phone && (
                          <a
                            href={`tel:${entry.store.phone}`}
                            className="inline-flex items-center rounded-md bg-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                          >
                            اتصال
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-8 mb-3 text-xl font-bold">المركبات المتوافقة</h2>

      {!vehiclesData || vehiclesData.length === 0 ? (
        <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
          لا توجد مركبات متوافقة بعد
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {vehiclesData.map((v, i) => {
            const vehicle = v.vehicles
            const make = vehicle.makeAr ?? vehicle.make ?? ''
            const model = vehicle.modelAr ?? vehicle.model ?? ''
            return (
              <div key={vehicle.id ?? i} className="rounded-xl border p-3 text-sm">
                <p className="font-medium">{make} {model}</p>
                <p className="text-xs text-muted-foreground">{vehicle.year}</p>
                {vehicle.engine && <p className="text-xs text-muted-foreground">محرك: {vehicle.engine}</p>}
                {vehicle.trim && <p className="text-xs text-muted-foreground">الفئة: {vehicle.trim}</p>}
              </div>
            )
          })}
        </div>
      )}

      <CartButton />
    </div>
  )
}
