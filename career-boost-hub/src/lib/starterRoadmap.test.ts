import { describe, expect, it } from 'vitest'
import { starterRoadmap } from './starterRoadmap'

describe('starterRoadmap', () => {
  const from = new Date(2026, 9, 6)
  it('returns 5 items 2 weeks apart as YYYY-MM-DD', () => {
    const r = starterRoadmap('Data Science', from)
    expect(r).toHaveLength(5)
    expect(r.map((i) => i.due_on)).toEqual(['2026-10-20', '2026-11-03', '2026-11-17', '2026-12-01', '2026-12-15'])
    r.forEach((i) => {
      expect(i.title.length).toBeGreaterThan(0)
      expect(i.title.length).toBeLessThanOrEqual(120)
    })
  })
  it('differs per path and falls back to generic items', () => {
    const a = starterRoadmap('Data Science', from)[0].title
    const b = starterRoadmap('Cybersecurity', from)[0].title
    expect(a).not.toBe(b)
    const g = starterRoadmap('Underwater Basket Weaving', from)
    expect(g).toHaveLength(5)
  })
  it('handles prototype keys as unknown', () => {
    expect(starterRoadmap('__proto__', from)).toHaveLength(5)
    expect(starterRoadmap('constructor', from)).toHaveLength(5)
  })
})
