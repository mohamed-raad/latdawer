'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'

export default function ForumPostPage() {
  const params = useParams()
  const postId = params.id as string
  const { t } = useLanguage()
  const [commentText, setCommentText] = useState('')

  const { data: post, isLoading: postLoading } = trpc.forum.getPost.useQuery({ id: postId })
  const { data: comments, refetch: refetchComments } = trpc.forum.getComments.useQuery({ postId })

  const addCommentMutation = trpc.forum.addComment.useMutation({
    onSuccess: () => {
      refetchComments()
      setCommentText('')
    },
  })

  const likeMutation = trpc.forum.likePost.useMutation()

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      addCommentMutation.mutate({ postId, content: commentText })
    }
  }

  if (postLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-center text-muted-foreground">{t('loading')}</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <p className="text-lg mb-4">{t('postNotFound')}</p>
        <Link href="/forum" className="text-sm text-muted-foreground hover:text-foreground">
          {t('back')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/forum" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
        {t('back')}
      </Link>

      {/* Post */}
      <article className="rounded-xl border p-6 mb-6">
        <h1 className="text-xl font-bold mb-2">{post.post.title}</h1>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span>{post.author.name}</span>
          <span>{new Date(post.post.createdAt).toLocaleDateString('ar-IQ')}</span>
          {post.post.category && (
            <span className="rounded bg-muted px-1.5 py-0.5">{post.post.category}</span>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.post.content}</p>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
          <button
            onClick={() => likeMutation.mutate({ id: postId })}
            className="hover:text-foreground transition-colors"
          >
            👍 {t('like')} ({post.post.likes})
          </button>
          <span>👁 {post.post.views} {t('views')}</span>
          <span>💬 {comments?.length || 0} {t('comments')}</span>
        </div>
      </article>

      {/* Comments */}
      <section>
        <h2 className="font-bold mb-4">{t('comments')} ({comments?.length || 0})</h2>

        {/* Comment Form */}
        <div className="rounded-xl border p-4 mb-4">
          <textarea
            placeholder={t('commentPlaceholder')}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm resize-none mb-2"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || addCommentMutation.isPending}
              className="rounded-lg bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
            >
              {addCommentMutation.isPending ? t('loading') : t('addComment')}
            </button>
          </div>
        </div>

        {/* Comments List */}
        {comments && comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map((item) => (
              <div key={item.comment.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{item.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.comment.createdAt).toLocaleDateString('ar-IQ')}
                  </span>
                </div>
                <p className="text-sm">{item.comment.content}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  👍 {item.comment.likes}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">{t('noResults')}</p>
        )}
      </section>
    </div>
  )
}
