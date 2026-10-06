import { describe, expect, it } from 'vitest'
import { redirectTarget } from './redirectTarget'

describe('redirectTarget', () => {
  it('defaults to /dashboard', () => {
    expect(redirectTarget(null)).toBe('/dashboard')
    expect(redirectTarget(undefined)).toBe('/dashboard')
    expect(redirectTarget({})).toBe('/dashboard')
  })
  it('uses a local from path', () => {
    expect(redirectTarget({ from: '/admin' })).toBe('/admin')
  })
  it('rejects external or non-string targets', () => {
    expect(redirectTarget({ from: '//evil.com' })).toBe('/dashboard')
    expect(redirectTarget({ from: 'https://evil.com' })).toBe('/dashboard')
    expect(redirectTarget({ from: 5 })).toBe('/dashboard')
  })
})
