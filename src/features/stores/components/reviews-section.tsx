'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useSession } from '@/hooks/use-session'

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: Date
  user: {
    name: string
  }
}

interface ReviewsSectionProps {
  storeId: string
  ratingData: { average: number; count: number } | null
  reviewsData: { results: Review[] } | null
  hasReviewed: boolean
  onRefetch: () => void
}

export function ReviewsSection({ storeId, ratingData, reviewsData, hasReviewed, onRefetch }: ReviewsSectionProps) {
  const { user } = useSession()
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')

  const reviewCreate = trpc.reviews.create.useMutation({
    onSuccess: () => {
      setReviewRating(0)
      setReviewComment('')
      onRefetch()
    },
  })

  return (
    <>
      <h2 className="mt-8 mb-3 text-xl font-bold">التقييمات</h2>

      {ratingData && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border p-4">
          <span className="text-3xl font-bold">{ratingData.average}</span>
          <div>
            <div className="flex text-lg">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={s <= Math.round(ratingData.average) ? 'text-amber-400' : 'text-muted-foreground'}>★</span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{ratingData.count} تقييم</p>
          </div>
        </div>
      )}

      {user && !hasReviewed && (
        <div className="mb-4 rounded-xl border p-4">
          <h3 className="mb-3 text-sm font-bold">أضف تقييمك</h3>
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setReviewRating(s)} className={`text-2xl ${s <= reviewRating ? 'text-amber-400' : 'text-muted-foreground'}`}>
                ★
              </button>
            ))}
          </div>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="اكتب تعليقك..."
            rows={3}
            className="mb-3 w-full rounded-lg border p-3 text-sm outline-none"
          />
          <button
            onClick={() => reviewCreate.mutate({ storeId, rating: reviewRating, comment: reviewComment || undefined })}
            disabled={reviewRating === 0 || reviewCreate.isPending}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {reviewCreate.isPending ? 'جاري الإرسال...' : 'إرسال التقييم'}
          </button>
        </div>
      )}

      {reviewsData && reviewsData.results.length > 0 ? (
        <div className="mb-8 space-y-3">
          {reviewsData.results.map((rev) => (
            <div key={rev.id} className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{rev.user.name}</p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={`text-sm ${s <= rev.rating ? 'text-amber-400' : 'text-muted-foreground'}`}>★</span>
                  ))}
                </div>
              </div>
              {rev.comment && <p className="mt-2 text-sm text-muted-foreground">{rev.comment}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{new Date(rev.createdAt).toLocaleDateString('ar-IQ')}</p>
            </div>
          ))}
        </div>
      ) : (
        !ratingData?.count && (
          <div className="mb-8 rounded-xl border p-6 text-center text-sm text-muted-foreground">
            لا توجد تقييمات بعد
          </div>
        )
      )}
    </>
  )
}