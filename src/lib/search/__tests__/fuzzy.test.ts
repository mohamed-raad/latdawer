import { describe, it, expect } from 'vitest'
import {
  calculateLevenshteinDistance,
  calculateSimilarity,
  isFuzzyMatch,
  generateSearchVariants,
} from '@/lib/search/fuzzy'

describe('Levenshtein distance', () => {
  it('calculates distance between identical strings', () => {
    expect(calculateLevenshteinDistance('hello', 'hello')).toBe(0)
  })

  it('calculates distance between different strings', () => {
    expect(calculateLevenshteinDistance('hello', 'world')).toBe(4)
  })

  it('handles empty strings', () => {
    expect(calculateLevenshteinDistance('', 'hello')).toBe(5)
    expect(calculateLevenshteinDistance('hello', '')).toBe(5)
  })
})

describe('Similarity', () => {
  it('returns 1.0 for identical strings', () => {
    expect(calculateSimilarity('hello', 'hello')).toBe(1.0)
  })

  it('returns high similarity for similar strings', () => {
    expect(calculateSimilarity('hello', 'helo')).toBeGreaterThan(0.7)
  })

  it('returns low similarity for different strings', () => {
    expect(calculateSimilarity('hello', 'world')).toBeLessThan(0.5)
  })
})

describe('Fuzzy match', () => {
  it('matches exact strings', () => {
    expect(isFuzzyMatch('hello', 'hello')).toBe(true)
  })

  it('matches partial strings', () => {
    expect(isFuzzyMatch('hel', 'hello world')).toBe(true)
  })

  it('matches similar strings', () => {
    expect(isFuzzyMatch('helo', 'hello', 0.6)).toBe(true)
  })

  it('rejects dissimilar strings', () => {
    expect(isFuzzyMatch('xyz', 'hello', 0.6)).toBe(false)
  })
})

describe('Search variants', () => {
  it('generates variants for Arabic text', () => {
    const variants = generateSearchVariants('أحمد')
    expect(variants).toContain('احمد')
  })

  it('generates deletion variants', () => {
    const variants = generateSearchVariants('hello')
    expect(variants).toContain('helo')
    expect(variants).toContain('hell')
  })

  it('generates swap variants', () => {
    const variants = generateSearchVariants('hello')
    expect(variants).toContain('hlelo')
  })

  it('removes duplicates', () => {
    const variants = generateSearchVariants('aaa')
    const uniqueVariants = [...new Set(variants)]
    expect(variants.length).toBe(uniqueVariants.length)
  })
})