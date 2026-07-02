import { z } from 'zod'
import { router, protectedProcedure, publicProcedure } from '@/lib/trpc/server'
import {
  createPost,
  getPostWithAuthor,
  listPosts,
  incrementViews,
  likePost,
  unlikePost,
  deletePost,
  addComment,
  getComments,
  deleteComment,
} from './services'
import { TRPCError } from '@trpc/server'

export const forumRouter = router({
  listPosts: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      limit: z.number().min(1).max(50).optional(),
      offset: z.number().min(0).optional(),
    }))
    .query(async ({ input }) => {
      return listPosts({
        category: input.category,
        limit: input.limit,
        offset: input.offset,
      })
    }),

  getPost: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const result = await getPostWithAuthor(input.id)
      if (!result) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      await incrementViews(input.id)
      return result
    }),

  createPost: protectedProcedure
    .input(z.object({
      title: z.string().min(3).max(200),
      content: z.string().min(10).max(5000),
      category: z.string().optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createPost({
        userId: ctx.userId!,
        ...input,
      })
    }),

  likePost: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await likePost(input.id)
      return { success: true }
    }),

  unlikePost: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await unlikePost(input.id)
      return { success: true }
    }),

  deletePost: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await deletePost(input.id, ctx.userId!)
      if (!deleted) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      return { success: true }
    }),

  // Comments
  getComments: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input }) => {
      return getComments(input.postId)
    }),

  addComment: protectedProcedure
    .input(z.object({
      postId: z.string(),
      content: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      return addComment({
        postId: input.postId,
        userId: ctx.userId!,
        content: input.content,
      })
    }),

  deleteComment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await deleteComment(input.id, ctx.userId!)
      if (!deleted) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      return { success: true }
    }),
})
