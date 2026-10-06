import { describe, expect, it } from 'vitest'
import { formatSlot, isUniqueViolation, mockReference, toStartsAtIso } from './booking'

const day = new Date(2026, 9, 6) // local calendar day 2026-10-06

describe('toStartsAtIso', () => {
  it('converts 09:00 AM IST to UTC', () => expect(toStartsAtIso(day, '09:00 AM')).toBe('2026-10-06T03:30:00.000Z'))
  it('12:00 PM is noon', () => expect(toStartsAtIso(day, '12:00 PM')).toBe('2026-10-06T06:30:00.000Z'))
  it('12:00 AM is midnight', () => expect(toStartsAtIso(day, '12:00 AM')).toBe('2026-10-05T18:30:00.000Z'))
  it('06:00 PM is 18:00', () => expect(toStartsAtIso(day, '06:00 PM')).toBe('2026-10-06T12:30:00.000Z'))
  it('throws on bad input', () => {
    expect(() => toStartsAtIso(day, 'noon')).toThrow()
    expect(() => toStartsAtIso(day, '13:00 PM')).toThrow()
    expect(() => toStartsAtIso(new Date('x'), '09:00 AM')).toThrow()
  })
})

describe('isUniqueViolation', () => {
  it('detects 23505 only', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true)
    expect(isUniqueViolation({ code: '42501' })).toBe(false)
    expect(isUniqueViolation(null)).toBe(false)
  })
})

describe('mockReference', () => {
  it('always has MOCK- prefix and 8 chars', () => expect(mockReference()).toMatch(/^MOCK-[0-9a-f]{8}$/))
})

describe('formatSlot', () => {
  it('is human readable with IST', () => expect(formatSlot('October 6th, 2026', '09:00 AM')).toBe('October 6th, 2026, 09:00 AM IST'))
})
