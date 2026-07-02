'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'

const CATEGORIES = [
  { id: 'all', labelAr: 'الكل', labelEn: 'All' },
  { id: 'general', labelAr: 'عام', labelEn: 'General' },
  { id: 'parts', labelAr: 'قطع غيار', labelEn: 'Parts' },
  { id: 'stores', labelAr: 'متاجر', labelEn: 'Stores' },
  { id: 'vehicles', labelAr: 'مركبات', labelEn: 'Vehicles' },
  { id: 'tips', labelAr: 'نصائح', labelEn: 'Tips' },
]

export default function ForumPage() {
  const { t, locale } = useLanguage()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showNewPost, setShowNewPost] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('general')

  const { data: posts, refetch, isLoading } = trpc.forum.listPosts.useQuery({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  })

  const createPostMutation = trpc.forum.createPost.useMutation({
    onSuccess: () => {
      refetch()
      setShowNewPost(false)
      setNewTitle('')
      setNewContent('')
    },
  })

  const handleSubmit = () => {
    if (newTitle.trim() && newContent.trim()) {
      createPostMutation.mutate({
        title: newTitle,
        content: newContent,
        category: newCategory,
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('forum')}</h1>
        <button
          onClick={() => setShowNewPost(!showNewPost)}
          className="rounded-lg bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
        >
          {t('newPost')}
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              selectedCategory === cat.id
                ? 'bg-foreground text-background'
                : 'border hover:bg-muted'
            }`}
          >
            {locale === 'ar' ? cat.labelAr : cat.labelEn}
          </button>
        ))}
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <div className="rounded-xl border p-4 mb-6 space-y-3">
          <h3 className="font-bold">{t('newPost')}</h3>
          <input
            type="text"
            placeholder={t('postTitle')}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
              <option key={cat.id} value={cat.id}>
                {locale === 'ar' ? cat.labelAr : cat.labelEn}
              </option>
            ))}
          </select>
          <textarea
            placeholder={t('postContent')}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
            className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowNewPost(false)}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!newTitle.trim() || !newContent.trim() || createPostMutation.isPending}
              className="rounded-lg bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
            >
              {createPostMutation.isPending ? t('loading') : t('submitPost')}
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">{t('loading')}</p>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((item) => (
            <Link
              key={item.post.id}
              href={`/forum/${item.post.id}`}
              className="block rounded-xl border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm mb-1 line-clamp-1">{item.post.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {item.post.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{item.author.name}</span>
                    {item.post.category && (
                      <span className="rounded bg-muted px-1.5 py-0.5">
                        {CATEGORIES.find((c) => c.id === item.post.category)
                          ? locale === 'ar'
                            ? CATEGORIES.find((c) => c.id === item.post.category)?.labelAr
                            : CATEGORIES.find((c) => c.id === item.post.category)?.labelEn
                          : item.post.category}
                      </span>
                    )}
                    <span>{item.commentCount} {t('comments')}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground shrink-0">
                  <span>👍 {item.post.likes}</span>
                  <span>👁 {item.post.views}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">{t('noPosts')}</p>
          <p className="text-sm">{t('beFirstToPost')}</p>
        </div>
      )}
    </div>
  )
}
