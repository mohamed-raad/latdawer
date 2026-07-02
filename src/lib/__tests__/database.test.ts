import { describe, it, expect, afterAll } from 'vitest'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

describe('Database Operations', () => {
  const testUserId = 'test-user-' + Date.now()
  const testEmail = `test-${Date.now()}@example.com`

  afterAll(async () => {
    await db.delete(users).where(eq(users.id, testUserId))
  })

  it('creates a new user', async () => {
    const result = await db.insert(users).values({
      id: testUserId,
      email: testEmail,
      passwordHash: 'hashed-password',
      name: 'Test User',
      role: 'Customer',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()

    expect(result.length).toBe(1)
    expect(result[0].email).toBe(testEmail)
  })

  it('fetches a user by email', async () => {
    const result = await db.select().from(users).where(eq(users.email, testEmail))
    expect(result.length).toBe(1)
    expect(result[0].id).toBe(testUserId)
  })

  it('updates a user', async () => {
    await db.update(users)
      .set({ name: 'Updated Name' })
      .where(eq(users.id, testUserId))

    const result = await db.select().from(users).where(eq(users.id, testUserId))
    expect(result[0].name).toBe('Updated Name')
  })

  it('deletes a user', async () => {
  })
})