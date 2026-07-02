import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

describe('Rate limiting', () => {
  beforeEach(() => {
    // Clear any existing rate limit entries
    // Note: In a real app, you'd mock the store or use a different approach
  })

  it('allows requests within limit', () => {
    const result = checkRateLimit('test-key-1', { windowMs: 60000, maxRequests: 10 })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
  })

  it('blocks requests over limit', () => {
    const key = 'test-key-2'
    for (let i = 0; i < 10; i++) {
      checkRateLimit(key, { windowMs: 60000, maxRequests: 10 })
    }
    const result = checkRateLimit(key, { windowMs: 60000, maxRequests: 10 })
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('returns correct headers', () => {
    const result = { allowed: true, remaining: 5, resetTime: Date.now() + 60000 }
    const headers = getRateLimitHeaders(result)
    expect(headers['X-RateLimit-Limit']).toBe('100')
    expect(headers['X-RateLimit-Remaining']).toBe('5')
    expect(headers['X-RateLimit-Reset']).toBeDefined()
  })
})