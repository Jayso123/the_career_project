import { describe, expect, it, vi } from 'vitest'
import { runMockBooking } from './bookingService'
import type { PayContext } from '../pages/Payment'

const ctx: PayContext = {
  date: 'October 6th, 2026',
  time: '09:00 AM',
  startsAt: '2026-10-06T03:30:00.000Z',
  phone: '+91 98765 43210',
  requirements: 'Need a roadmap',
  mentor: { name: 'Priya Sharma', expertise: 'Tech' },
  plan: { name: 'Basic', price: '₹299', description: '', features: [] },
  amount: 299,
}
const who = { id: 'u1', email: 'a@b.co', fullName: 'Asha' }
const ok = { mentors: { data: { id: 'm1' } }, sessions: { data: { id: 's1' } }, payments: { data: { id: 'p1' } } }

// minimal chainable fake keyed by table
function fake(res: Record<string, { data?: unknown; error?: unknown }>) {
  const calls: [string, string, unknown?][] = []
  const db = {
    from: (t: string) => {
      const r = () => Promise.resolve({ data: null, error: null, ...(res[t] ?? {}) })
      const chain: Record<string, unknown> = { select: () => chain, eq: () => chain, maybeSingle: r, single: r }
      chain.insert = (v: unknown) => (calls.push([t, 'insert', v]), chain)
      chain.update = (v: unknown) => (calls.push([t, 'update', v]), chain)
      chain.then = (f: (x: unknown) => unknown) => r().then(f)
      return chain
    },
  }
  return { db: db as never, calls }
}

describe('runMockBooking', () => {
  it('happy path: mock payment, link, owner email, MOCK- reference', async () => {
    const send = vi.fn().mockResolvedValue(true)
    const { db, calls } = fake(ok)
    const out = await runMockBooking(db, ctx, who, send)
    expect(out.ok && out.paymentId).toMatch(/^MOCK-/)
    expect(calls.find((c) => c[0] === 'payments')?.[2]).toMatchObject({ mode: 'mock', status: 'paid', amount_inr: 299 })
    expect(calls.find((c) => c[0] === 'sessions' && c[1] === 'update')?.[2]).toEqual({ payment_id: 'p1' })
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ kind: 'booking', phone: ctx.phone, slot: 'October 6th, 2026, 09:00 AM IST' }))
  })
  it('unknown mentor', async () => {
    expect(await runMockBooking(fake({ mentors: { data: null } }).db, ctx, who)).toEqual({ ok: false, reason: 'mentor' })
  })
  it('unique violation -> taken, nothing else written', async () => {
    const { db, calls } = fake({ ...ok, sessions: { error: { code: '23505' } } })
    expect(await runMockBooking(db, ctx, who)).toEqual({ ok: false, reason: 'taken' })
    expect(calls.some((c) => c[0] === 'payments')).toBe(false)
  })
  it('other session insert error -> error', async () => {
    expect(await runMockBooking(fake({ ...ok, sessions: { error: { code: '42501' } } }).db, ctx, who)).toEqual({ ok: false, reason: 'error' })
  })
  it('payment failure after session insert -> partial', async () => {
    expect(await runMockBooking(fake({ ...ok, payments: { error: { code: 'x' } } }).db, ctx, who)).toEqual({ ok: false, reason: 'partial' })
  })
  it('email failure does not fail the booking', async () => {
    const out = await runMockBooking(fake(ok).db, ctx, who, vi.fn().mockResolvedValue(false))
    expect(out.ok).toBe(true)
  })
  it('missing startsAt is invalid', async () => {
    expect(await runMockBooking(fake({}).db, { ...ctx, startsAt: undefined }, who)).toEqual({ ok: false, reason: 'invalid' })
  })
})
