import { describe, expect, it } from 'vitest'
import { deleteMentor, fetchBookings, isFkViolation, setSessionStatus } from './adminApi'

function fake(res: Record<string, unknown>) {
  const calls: unknown[][] = []
  const db = {
    from: (t: string) => {
      let op = 'select'
      const c: Record<string, unknown> = {}
      for (const m of ['select', 'eq', 'order']) c[m] = (...a: unknown[]) => (calls.push([t, m, ...a]), c)
      for (const m of ['update', 'delete']) c[m] = (...a: unknown[]) => ((op = m), calls.push([t, m, ...a]), c)
      c.then = (f: never, g: never) => {
        const r = res[`${t}.${op}`]
        return (r === 'throw' ? Promise.reject(new Error('net')) : Promise.resolve({ data: null, error: null, ...(r as object) })).then(f, g)
      }
      return c
    },
  }
  return { db: db as never, calls }
}

describe('adminApi', () => {
  it('fetchBookings normalises embeds (arrays or objects) and nulls', async () => {
    const { db } = fake({
      'sessions.select': {
        data: [{ id: '1', mentors: [{ name: 'M' }], profiles: { full_name: 'S' }, payments: [{ reference: 'MOCK-1', mode: 'mock' }] }, { id: '2', mentors: null, profiles: null, payments: [] }],
      },
    })
    const r = await fetchBookings(db)
    expect(r.data).toEqual([
      { id: '1', mentor: { name: 'M' }, student: { full_name: 'S' }, payment: { reference: 'MOCK-1', mode: 'mock' } },
      { id: '2', mentor: null, student: null, payment: null },
    ])
  })
  it('setSessionStatus returns error, never throws', async () => {
    expect(await setSessionStatus(fake({ 'sessions.update': { error: { message: 'x' } } }).db, '1', 'completed')).toBeTruthy()
    expect(await setSessionStatus(fake({ 'sessions.update': 'throw' }).db, '1', 'completed')).toBeTruthy()
    expect(await setSessionStatus(fake({}).db, '1', 'completed')).toBeNull()
  })
  it('deleteMentor flags FK violations (23503)', async () => {
    const r = await deleteMentor(fake({ 'mentors.delete': { error: { code: '23503' } } }).db, 'm')
    expect(isFkViolation(r)).toBe(true)
    expect(isFkViolation({ code: '42501' })).toBe(false)
    expect(isFkViolation(null)).toBe(false)
  })
})
