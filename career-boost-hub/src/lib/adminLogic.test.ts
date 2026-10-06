import { describe, expect, it } from 'vitest'
import { filterBookings, filterLeads, validateMentor, type BookingRow } from './adminLogic'

const b = (o: Partial<BookingRow>): BookingRow => ({
  id: '1', starts_at: '2026-10-07T04:00:00Z', plan: 'Basic', requirements: '', status: 'booked',
  mentor: { name: 'Asha Rao' }, student: { full_name: 'Ravi Kumar' }, payment: null, ...o,
})
describe('filterBookings', () => {
  const rows = [b({ id: 'a' }), b({ id: 'b', status: 'cancelled', requirements: 'Need resume REVIEW', mentor: null, student: null })]
  it('filters by status', () => {
    expect(filterBookings(rows, 'all', '').map((r) => r.id)).toEqual(['a', 'b'])
    expect(filterBookings(rows, 'cancelled', '').map((r) => r.id)).toEqual(['b'])
  })
  it('searches student, mentor, requirements case-insensitively; null joins safe', () => {
    expect(filterBookings(rows, 'all', ' ravi ').map((r) => r.id)).toEqual(['a'])
    expect(filterBookings(rows, 'all', 'ASHA').map((r) => r.id)).toEqual(['a'])
    expect(filterBookings(rows, 'all', 'review').map((r) => r.id)).toEqual(['b'])
    expect(filterBookings(rows, 'all', 'zzz')).toEqual([])
  })
})
describe('filterLeads', () => {
  const l = [{ id: '1', name: 'Neha', email: 'n@x.com', phone: '+91 99999 11111', goals: 'PM role', created_at: '' }]
  it('matches name/email/phone/goals', () => {
    expect(filterLeads(l, 'pm')).toHaveLength(1)
    expect(filterLeads(l, 'n@x')).toHaveLength(1)
    expect(filterLeads(l, '99999')).toHaveLength(1)
    expect(filterLeads(l, 'nope')).toHaveLength(0)
    expect(filterLeads(l, '  ')).toHaveLength(1)
  })
})
describe('validateMentor', () => {
  const ok = { name: ' Asha ', title: 'Eng', company: 'X', bio: 'b', skills: 'React, , Node ,', rate_inr: '500', photo_url: '' }
  it('normalises valid input', () => {
    const r = validateMentor(ok)
    expect(r.ok && r.value).toEqual({ name: 'Asha', title: 'Eng', company: 'X', bio: 'b', skills: ['React', 'Node'], rate_inr: 500, photo_url: null })
  })
  it('accepts https photo', () => {
    const r = validateMentor({ ...ok, photo_url: 'https://a.co/p.png' })
    expect(r.ok && r.value.photo_url).toBe('https://a.co/p.png')
  })
  it.each([
    ['name', { name: '  ' }], ['name', { name: 'x'.repeat(101) }], ['title', { title: 'x'.repeat(101) }],
    ['company', { company: 'x'.repeat(101) }], ['bio', { bio: 'x'.repeat(1001) }],
    ['rate_inr', { rate_inr: '-1' }], ['rate_inr', { rate_inr: '1.5' }], ['rate_inr', { rate_inr: 'abc' }], ['rate_inr', { rate_inr: '' }],
    ['photo_url', { photo_url: 'http://a.co/p.png' }], ['photo_url', { photo_url: 'javascript:alert(1)' }], ['photo_url', { photo_url: 'nope' }],
  ])('rejects bad %s', (field, patch) => {
    const r = validateMentor({ ...ok, ...patch })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors[field]).toBeTruthy()
  })
})
