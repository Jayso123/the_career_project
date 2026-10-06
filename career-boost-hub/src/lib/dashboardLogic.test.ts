import { describe, expect, it } from 'vitest'
import { formatIst, isOverdue, progress, sortByDue, splitSessions } from './dashboardLogic'

const now = new Date('2026-10-06T10:00:00Z')
const s = (id: string, starts_at: string, status = 'booked') => ({ id, starts_at, status })

describe('splitSessions', () => {
  it('upcoming = booked and strictly in the future; exactly now is past', () => {
    const { upcoming, past } = splitSessions(
      [s('a', '2026-10-07T00:00:00Z'), s('b', '2026-10-06T10:00:00Z'), s('c', '2026-10-01T00:00:00Z'), s('d', '2026-10-09T00:00:00Z', 'cancelled'), s('e', '2026-10-08T00:00:00Z')],
      now,
    )
    expect(upcoming.map((x) => x.id)).toEqual(['a', 'e'])
    expect(past.map((x) => x.id)).toEqual(['d', 'b', 'c'])
  })
  it('empty input', () => {
    expect(splitSessions([], now)).toEqual({ upcoming: [], past: [] })
  })
})

describe('isOverdue', () => {
  it('null due date is never overdue', () => expect(isOverdue({ due_on: null, done: false }, '2026-10-06')).toBe(false))
  it('past and not done is overdue', () => expect(isOverdue({ due_on: '2026-10-05', done: false }, '2026-10-06')).toBe(true))
  it('today is not overdue; done is not overdue', () => {
    expect(isOverdue({ due_on: '2026-10-06', done: false }, '2026-10-06')).toBe(false)
    expect(isOverdue({ due_on: '2026-10-05', done: true }, '2026-10-06')).toBe(false)
  })
})

describe('progress', () => {
  it('empty is 0', () => expect(progress([])).toBe(0))
  it('rounds percentage', () => expect(progress([{ done: true }, { done: false }, { done: false }])).toBe(33))
  it('all done is 100', () => expect(progress([{ done: true }])).toBe(100))
})

describe('sortByDue', () => {
  it('orders by due date, nulls last, stable', () => {
    const r = sortByDue([{ id: 1, due_on: null }, { id: 2, due_on: '2026-11-01' }, { id: 3, due_on: '2026-10-01' }, { id: 4, due_on: null }])
    expect(r.map((x) => x.id)).toEqual([3, 2, 1, 4])
  })
})

describe('formatIst', () => {
  it('formats in IST', () => {
    expect(formatIst('2026-10-06T03:30:00.000Z')).toBe('Tue, 6 Oct 2026 · 09:00 AM IST')
    expect(formatIst('2026-10-06T10:30:00.000Z')).toBe('Tue, 6 Oct 2026 · 04:00 PM IST')
  })
  it('bad input does not throw', () => expect(formatIst('nope')).toBe('Invalid date'))
})
