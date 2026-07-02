import { describe, it, expect } from 'vitest'
import { calculateSearchScore } from '@/lib/search/ranking'

describe('Search ranking', () => {
  const mockPart = {
    partNumber: '27415-0W040',
    oemNumber: 'OEM-12345',
    nameAr: 'بكرة دينمو',
    nameEn: 'Alternator Pulley',
    brand: 'Toyota',
    alternativeNames: JSON.stringify(['OAP', 'Freewheel Pulley']),
  }

  it('gives highest score for exact part number match', () => {
    const score = calculateSearchScore('27415-0W040', mockPart)
    expect(score).toBeGreaterThanOrEqual(100)
  })

  it('gives high score for exact OEM match', () => {
    const score = calculateSearchScore('OEM-12345', mockPart)
    expect(score).toBeGreaterThanOrEqual(90)
  })

  it('gives good score for Arabic name match', () => {
    const score = calculateSearchScore('بكرة دينمو', mockPart)
    expect(score).toBeGreaterThanOrEqual(60)
  })

  it('gives good score for English name match', () => {
    const score = calculateSearchScore('Alternator Pulley', mockPart)
    expect(score).toBeGreaterThanOrEqual(50)
  })

  it('gives score for brand match', () => {
    const score = calculateSearchScore('Toyota', mockPart)
    expect(score).toBeGreaterThanOrEqual(40)
  })

  it('gives score for alternative name match', () => {
    const score = calculateSearchScore('OAP', mockPart)
    expect(score).toBeGreaterThanOrEqual(30)
  })

  it('gives partial score for partial matches', () => {
    const score = calculateSearchScore('27415', mockPart)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(100)
  })

  it('returns 0 for no match', () => {
    const score = calculateSearchScore('xyz123', mockPart)
    expect(score).toBe(0)
  })
})