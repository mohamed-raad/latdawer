import { describe, it, expect } from 'vitest'
import { normalizeSearchQuery } from '@/lib/search/normalize'
import { calculateSearchScore } from '@/lib/search/ranking'
import { generateSearchVariants } from '@/lib/search/fuzzy'

describe('Search Integration', () => {
  const mockParts = [
    {
      partNumber: '27415-0W040',
      oemNumber: 'OEM-12345',
      nameAr: 'بكرة دينمو',
      nameEn: 'Alternator Pulley',
      brand: 'Toyota',
      alternativeNames: JSON.stringify(['OAP', 'Freewheel Pulley']),
    },
    {
      partNumber: '12345-67890',
      oemNumber: null,
      nameAr: 'فلتر زيت',
      nameEn: 'Oil Filter',
      brand: 'Nissan',
      alternativeNames: null,
    },
  ]

  it('normalizes Arabic search query', () => {
    const query = 'بكرة'
    const normalized = normalizeSearchQuery(query)
    expect(normalized).toBe('بكره')
  })

  it('scores exact part number match highest', () => {
    const score1 = calculateSearchScore('27415-0W040', mockParts[0])
    const score2 = calculateSearchScore('27415', mockParts[0])
    expect(score1).toBeGreaterThan(score2)
  })

  it('scores Arabic name match', () => {
    const score = calculateSearchScore('بكرة دينمو', mockParts[0])
    expect(score).toBeGreaterThanOrEqual(60)
  })

  it('generates search variants', () => {
    const variants = generateSearchVariants('أحمد')
    expect(variants.length).toBeGreaterThan(1)
    expect(variants).toContain('احمد')
  })

  it('handles multiple search terms', () => {
    const query = 'بكرة دينمو toyota'
    const normalized = normalizeSearchQuery(query)
    expect(normalized).toContain('بكره')
    expect(normalized).toContain('دينمو')
    expect(normalized).toContain('toyota')
  })
})