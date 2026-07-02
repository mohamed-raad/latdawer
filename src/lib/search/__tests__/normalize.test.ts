import { describe, it, expect } from 'vitest'
import { normalizeArabic, normalizeSearchQuery } from '@/lib/search/normalize'

describe('Arabic normalization', () => {
  it('normalizes alef variants', () => {
    expect(normalizeArabic('أحمد')).toBe('احمد')
    expect(normalizeArabic('إسماعيل')).toBe('اسماعيل')
    expect(normalizeArabic('آدم')).toBe('ادم')
  })

  it('normalizes ta marbuta', () => {
    expect(normalizeArabic('بكرة')).toBe('بكره')
    expect(normalizeArabic('مكتبة')).toBe('مكتبه')
  })

  it('normalizes alef maqsura', () => {
    expect(normalizeArabic('عليى')).toBe('عليي')
  })

  it('removes tatweel', () => {
    expect(normalizeArabic('بــ')).toBe('ب')
  })

  it('normalizes search queries', () => {
    expect(normalizeSearchQuery('بكرة  دينمو')).toBe('بكره دينمو')
  })

  it('handles empty strings', () => {
    expect(normalizeArabic('')).toBe('')
    expect(normalizeSearchQuery('')).toBe('')
  })
})