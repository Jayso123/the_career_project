import { describe, expect, it, vi } from 'vitest'
import { emptyResume } from './resumeModel'
import { createSaver, loadLocal, loadRemote, saveLocal } from './resumeStorage'

function timers() {
  let fn: (() => void) | null = null
  return {
    setTimer: (f: () => void) => ((fn = f), 1 as never),
    clearTimer: () => { fn = null },
    fire: () => { const f = fn; fn = null; return f?.() },
    pending: () => fn !== null,
  }
}
function stub(results: ('ok' | 'err' | 'throw')[]) {
  const upserts: unknown[][] = []
  let i = 0
  const db = {
    from: (t: string) => ({
      upsert: (row: unknown, opts: unknown) => {
        upserts.push([t, row, opts])
        const r = results[Math.min(i++, results.length - 1)]
        if (r === 'throw') return Promise.reject(new Error('net'))
        return Promise.resolve({ error: r === 'err' ? { message: 'x' } : null })
      },
    }),
  }
  return { db: db as never, upserts }
}
const r1 = { ...emptyResume(), summary: 'one' }
const r2 = { ...emptyResume(), summary: 'two' }

describe('createSaver', () => {
  it('debounces and coalesces to the last value', async () => {
    const t = timers(); const { db, upserts } = stub(['ok']); const onStatus = vi.fn()
    const s = createSaver(db, 'u1', { ...t, onStatus, onFailure: vi.fn() })
    s.save(r1); s.save(r2)
    expect(upserts).toHaveLength(0)
    await t.fire()
    expect(upserts).toHaveLength(1)
    expect(upserts[0][0]).toBe('resumes')
    expect(upserts[0][2]).toEqual({ onConflict: 'student_id' })
    expect(upserts[0][1]).toMatchObject({ student_id: 'u1', data: r2 })
    expect(typeof (upserts[0][1] as { updated_at: string }).updated_at).toBe('string')
    expect(onStatus.mock.calls.map((c) => c[0])).toEqual(['saving', 'saved'])
  })
  it('calls onFailure once per failure streak, resets after success, never throws', async () => {
    const t = timers(); const { db } = stub(['err', 'throw', 'err', 'ok', 'err']); const onFailure = vi.fn(); const onStatus = vi.fn()
    const s = createSaver(db, 'u1', { ...t, onStatus, onFailure })
    for (let i = 0; i < 3; i++) { s.save(r1); await expect(t.fire()).resolves.toBeUndefined() }
    expect(onFailure).toHaveBeenCalledTimes(1)
    expect(onStatus).toHaveBeenLastCalledWith('error')
    s.save(r1); await t.fire()
    expect(onStatus).toHaveBeenLastCalledWith('saved')
    s.save(r1); await t.fire()
    expect(onFailure).toHaveBeenCalledTimes(2)
  })
  it('cancel drops the pending save', () => {
    const t = timers(); const { db, upserts } = stub(['ok'])
    const s = createSaver(db, 'u1', { ...t, onStatus: vi.fn(), onFailure: vi.fn() })
    s.save(r1); s.cancel()
    expect(t.pending()).toBe(false); expect(upserts).toHaveLength(0)
  })
})

describe('local storage', () => {
  it('round-trips and survives a throwing/corrupt store', () => {
    const mem = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) })
    expect(loadLocal()).toBeNull()
    saveLocal(r1)
    expect(loadLocal()?.summary).toBe('one')
    mem.set('cbh.resume.v1', '{not json')
    expect(loadLocal()).toBeNull()
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } })
    expect(loadLocal()).toBeNull()
    expect(() => saveLocal(r1)).not.toThrow()
    vi.unstubAllGlobals()
  })
})

describe('loadRemote', () => {
  const fake = (res: unknown) => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => (res === 'throw' ? Promise.reject(new Error('n')) : Promise.resolve(res)) }) }) }) }) as never
  it('normalizes the row, null when none, undefined on failure', async () => {
    expect((await loadRemote(fake({ data: { data: { summary: 'db' } }, error: null }), 'u'))?.summary).toBe('db')
    expect(await loadRemote(fake({ data: null, error: null }), 'u')).toBeNull()
    expect(await loadRemote(fake({ data: null, error: { message: 'x' } }), 'u')).toBeUndefined()
    expect(await loadRemote(fake('throw'), 'u')).toBeUndefined()
  })
})
