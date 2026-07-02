import { describe, it, expect } from 'vitest'
import ar from '@/lib/i18n/ar'
import en from '@/lib/i18n/en'
import ku from '@/lib/i18n/ku'

describe('i18n translations', () => {
  it('has all required Arabic keys', () => {
    expect(ar.appName).toBeDefined()
    expect(ar.search).toBeDefined()
    expect(ar.login).toBeDefined()
    expect(ar.dashboard).toBeDefined()
    expect(ar.categories).toBeDefined()
    expect(ar.manufacturers).toBeDefined()
  })

  it('has all required English keys', () => {
    expect(en.appName).toBeDefined()
    expect(en.search).toBeDefined()
    expect(en.login).toBeDefined()
    expect(en.dashboard).toBeDefined()
    expect(en.categories).toBeDefined()
    expect(en.manufacturers).toBeDefined()
  })

  it('has all required Kurdish keys', () => {
    expect(ku.appName).toBeDefined()
    expect(ku.search).toBeDefined()
    expect(ku.login).toBeDefined()
  })

  it('has matching keys between Arabic and English', () => {
    const arKeys = Object.keys(ar)
    const enKeys = Object.keys(en)
    expect(arKeys.sort()).toEqual(enKeys.sort())
  })
})