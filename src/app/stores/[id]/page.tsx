'use client'

import { use } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { StoreHeader } from '@/features/stores/components/store-header'
import { StoreInfo } from '@/features/stores/components/store-info'
import { InventoryTable } from '@/features/stores/components/inventory-table'
import { ReviewsSection } from '@/features/stores/components/reviews-section'

export default function StoreProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: store, isLoading: storeLoading } = trpc.stores.byId.useQuery({ id })
  const { data: inventoryData, isLoading: inventoryLoading } = trpc.inventory.list.useQuery({ storeId: id })
  const { data: ratingData } = trpc.reviews.rating.useQuery({ storeId: id })
  const { data: reviewsData, refetch: refetchReviews } = trpc.reviews.list.useQuery({ storeId: id, page: 1, limit: 20 })
  const { data: hasReviewedData } = trpc.reviews.hasReviewed.useQuery({ storeId: id })

  if (storeLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="mx-auto h-24 w-24 rounded-full bg-muted" />
          <div className="mx-auto h-6 w-48 rounded bg-muted" />
          <div className="h-20 rounded-xl bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-muted-foreground">المتجر غير موجود</p>
        <Link href="/search" className="mt-4 inline-block text-sm font-medium hover:underline">
          العودة للبحث
        </Link>
      </div>
    )
  }

  const inventory = inventoryData?.results ?? []

  return (
    <div className="mx-auto max-w-4xl px-4 py-6" dir="rtl">
      <Link href="/search" className="text-sm text-muted-foreground hover:underline">
        &larr; العودة للنتائج
      </Link>

      <div className="mt-4">
        <StoreHeader store={store} />
        <StoreInfo
          phone={store.phone}
          whatsapp={store.whatsapp}
          address={store.address}
          city={store.city}
          workingHours={store.workingHours}
          storeName={store.nameAr || store.name}
        />
      </div>

      <h2 className="mt-8 mb-3 text-xl font-bold">القطع المتوفرة</h2>
      <InventoryTable inventory={inventory} isLoading={inventoryLoading} />

      <ReviewsSection
        storeId={id}
        ratingData={ratingData ?? null}
        reviewsData={reviewsData ?? null}
        hasReviewed={hasReviewedData?.reviewed ?? false}
        onRefetch={refetchReviews}
      />

      <div className="mt-8 rounded-xl border p-6">
        <h3 className="text-lg font-bold">طرق الدفع المتاحة</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="text-muted-foreground">•</span>
            زين كاش (Zain Cash)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-muted-foreground">•</span>
            آسيا حوالة (Asia Hawala)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-muted-foreground">•</span>
            تحويل بنكي (Bank Transfer)
          </li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          يُرجى التواصل مع المتجر لتفاصيل الدفع
        </p>
      </div>
    </div>
  )
}