import { describe, it, expect, vi } from 'vitest'
import { buildEmailParams, notifyOwner, notifyStudent, type Lead } from './notify'

const booking: Lead = {
  kind: 'booking', name: 'Asha Rao', email: 'asha@example.com', phone: '+91 98765 43210',
  requirements: 'Switch to data science', mentor: 'Priya Sharma', plan: 'Standard', slot: '2026-11-02T10:00:00Z',
}

describe('notify', () => {
  it('builds params with every detail the owner needs', () => {
    const p = buildEmailParams(booking, 'owner@example.com')
    expect(p.to_email).toBe('owner@example.com')
    expect(p.subject).toBe('New session booking: Asha Rao')
    for (const s of ['Asha Rao', 'asha@example.com', '+91 98765 43210', 'Switch to data science', 'Priya Sharma', 'Standard'])
      expect(p.message).toContain(s)
    expect(p.reply_to).toBe('asha@example.com')
  })
  it('contact kind has its own subject and no mentor lines', () => {
    const p = buildEmailParams({ ...booking, kind: 'contact', mentor: undefined, plan: undefined, slot: undefined }, 'o@x.com')
    expect(p.subject).toBe('New contact message: Asha Rao')
    expect(p.message).not.toContain('Mentor')
  })
  it('never throws when sending fails', async () => {
    const send = vi.fn().mockRejectedValue(new Error('network'))
    await expect(notifyOwner(booking, send, 'o@x.com')).resolves.toBe(false)
  })
  it('skips sending when owner email is blank', async () => {
    const send = vi.fn()
    expect(await notifyOwner(booking, send, '')).toBe(false)
    expect(send).not.toHaveBeenCalled()
  })
  it('returns true when sent', async () => {
    const send = vi.fn().mockResolvedValue(undefined)
    expect(await notifyOwner(booking, send, 'owner@example.com')).toBe(true)
  })
})

describe('notifyStudent', () => {
  const c = { email: 'asha@example.com', name: 'Asha', mentor: 'Priya Sharma', plan: 'Standard', slot: '2 Nov, 10:00', reference: 'MOCK-1' }
  it('sends the confirmation to the student', async () => {
    const send = vi.fn().mockResolvedValue(undefined)
    expect(await notifyStudent(c, send, 'tpl')).toBe(true)
    expect(send.mock.calls[0][0]).toMatchObject({ to_email: 'asha@example.com', student_name: 'Asha', mentor: 'Priya Sharma', reference: 'MOCK-1' })
  })
  it('skips without a template id or email, and never throws', async () => {
    const send = vi.fn().mockRejectedValue(new Error('x'))
    expect(await notifyStudent(c, send, '')).toBe(false)
    expect(await notifyStudent({ ...c, email: '' }, send, 'tpl')).toBe(false)
    expect(send).not.toHaveBeenCalled()
    expect(await notifyStudent(c, send, 'tpl')).toBe(false)
  })
})
