import { db } from '@/db'
import { forumPosts, forumComments } from '@/db/schema/advanced'
import { users } from '@/db/schema/users'
import { eq, desc, sql, and } from 'drizzle-orm'

export interface CreatePostInput {
  userId: string
  title: string
  content: string
  category?: string
  tags?: string
}

export interface CreateCommentInput {
  postId: string
  userId: string
  content: string
}

export async function createPost(data: CreatePostInput) {
  const [post] = await db.insert(forumPosts).values({
    id: crypto.randomUUID(),
    ...data,
    likes: 0,
    views: 0,
    createdAt: new Date(),
  }).returning()
  return post
}

export async function getPost(id: string) {
  const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id))
  return post
}

export async function getPostWithAuthor(id: string) {
  const [result] = await db
    .select({
      post: forumPosts,
      author: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(forumPosts)
    .innerJoin(users, eq(forumPosts.userId, users.id))
    .where(eq(forumPosts.id, id))
  return result
}

export async function listPosts(options?: {
  category?: string
  limit?: number
  offset?: number
}) {
  const limit = options?.limit || 20
  const offset = options?.offset || 0

  const query = db
    .select({
      post: forumPosts,
      author: {
        id: users.id,
        name: users.name,
      },
      commentCount: sql<number>`(select count(*) from ${forumComments} where ${forumComments.postId} = ${forumPosts.id})`,
    })
    .from(forumPosts)
    .innerJoin(users, eq(forumPosts.userId, users.id))
    .orderBy(desc(forumPosts.createdAt))
    .limit(limit)
    .offset(offset)

  if (options?.category) {
    return query.where(eq(forumPosts.category, options.category))
  }

  return query
}

export async function incrementViews(id: string) {
  await db
    .update(forumPosts)
    .set({ views: sql`${forumPosts.views} + 1` })
    .where(eq(forumPosts.id, id))
}

export async function likePost(id: string) {
  await db
    .update(forumPosts)
    .set({ likes: sql`${forumPosts.likes} + 1` })
    .where(eq(forumPosts.id, id))
}

export async function unlikePost(id: string) {
  await db
    .update(forumPosts)
    .set({ likes: sql`${forumPosts.likes} - 1` })
    .where(and(eq(forumPosts.id, id), sql`${forumPosts.likes} > 0`))
}

export async function deletePost(id: string, userId: string) {
  const post = await getPost(id)
  if (!post || post.userId !== userId) return false
  await db.delete(forumPosts).where(eq(forumPosts.id, id))
  return true
}

// ─── Comments ───

export async function addComment(data: CreateCommentInput) {
  const [comment] = await db.insert(forumComments).values({
    id: crypto.randomUUID(),
    ...data,
    likes: 0,
    createdAt: new Date(),
  }).returning()
  return comment
}

export async function getComments(postId: string) {
  return db
    .select({
      comment: forumComments,
      author: {
        id: users.id,
        name: users.name,
      },
    })
    .from(forumComments)
    .innerJoin(users, eq(forumComments.userId, users.id))
    .where(eq(forumComments.postId, postId))
    .orderBy(forumComments.createdAt)
}

export async function deleteComment(id: string, userId: string) {
  const [comment] = await db.select().from(forumComments).where(eq(forumComments.id, id))
  if (!comment || comment.userId !== userId) return false
  await db.delete(forumComments).where(eq(forumComments.id, id))
  return true
}
