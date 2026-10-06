import { afterEach, describe, expect, it, vi } from 'vitest'
import { emptyResume } from './resumeModel'
import { adoptAnon, createSaver, keyFor, loadLocal, loadRemote, pickResume, removeLocal, saveLocal } from './resumeStorage'

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
const mkSaver = (db: never, uid = 'u1') => {
  const t = timers(); const onStatus = vi.fn(); const onFailure = vi.fn()
  return { t, onStatus, onFailure, s: createSaver(db, uid, { ...t, onStatus, onFailure }) }
}

describe('createSaver', () => {
  it('debounces and coalesces to the last value', async () => {
    const { db, upserts } = stub(['ok'])
    const { t, onStatus, s } = mkSaver(db)
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
    const { db } = stub(['err', 'throw', 'err', 'ok', 'err'])
    const { t, onStatus, onFailure, s } = mkSaver(db)
    for (let i = 0; i < 3; i++) { s.save(r1); await expect(t.fire()).resolves.toBeUndefined() }
    expect(onFailure).toHaveBeenCalledTimes(1)
    expect(onStatus).toHaveBeenLastCalledWith('error')
    s.save(r1); await t.fire()
    expect(onStatus).toHaveBeenLastCalledWith('saved')
    s.save(r1); await t.fire()
    expect(onFailure).toHaveBeenCalledTimes(2)
  })
  it('cancel drops the pending save', () => {
    const { db, upserts } = stub(['ok'])
    const { t, s } = mkSaver(db)
    s.save(r1); s.cancel()
    expect(t.pending()).toBe(false); expect(upserts).toHaveLength(0)
  })
  it('flush (unmount inside the debounce window) writes exactly once with the newest data', async () => {
    const { db, upserts } = stub(['ok'])
    const { t, s } = mkSaver(db)
    s.save(r1); s.save(r2)
    await s.flush()
    expect(t.pending()).toBe(false)
    expect(upserts).toHaveLength(1)
    expect(upserts[0][1]).toMatchObject({ data: r2 })
    await s.flush()
    expect(upserts).toHaveLength(1)
  })
  it('flush with nothing pending makes no call', async () => {
    const { db, upserts } = stub(['ok'])
    await mkSaver(db).s.flush()
    expect(upserts).toHaveLength(0)
  })
  it('flush writes under the saver own uid', async () => {
    const { db, upserts } = stub(['ok'])
    const a = mkSaver(db, 'userA'); const b = mkSaver(db, 'userB')
    a.s.save(r1)
    await a.s.flush()
    expect(upserts).toHaveLength(1)
    expect(upserts[0][1]).toMatchObject({ student_id: 'userA' })
    expect(b.t.pending()).toBe(false)
  })
  it('serialises upserts: a second one starts only after the first settles, with the latest data', async () => {
    const gates: (() => void)[] = []
    const upserts: unknown[] = []
    const db = { from: () => ({ upsert: (row: unknown) => { upserts.push(row); return new Promise((res) => gates.push(() => res({ error: null }))) } }) } as never
    const { t, onStatus, s } = mkSaver(db)
    const tick = () => new Promise((r) => setTimeout(r, 0))
    s.save(r1); void t.fire(); await tick()
    expect(upserts).toHaveLength(1)
    s.save(r2); void t.fire(); await tick()
    expect(upserts).toHaveLength(1) // still waiting on the first
    gates[0](); await tick()
    expect(upserts).toHaveLength(2)
    expect(upserts[1]).toMatchObject({ data: r2 })
    gates[1](); await tick()
    // the stale first completion must not report 'saved' while a newer write was pending
    expect(onStatus.mock.calls.map((c) => c[0])).toEqual(['saving', 'saving', 'saved'])
  })
})

describe('local storage', () => {
  const mem = new Map<string, string>()
  const stubMem = () => vi.stubGlobal('localStorage', { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) })
  afterEach(() => { vi.unstubAllGlobals(); mem.clear() })

  it('namespaces the key per owner', () => {
    expect(keyFor('u1')).toBe('cbh.resume.v1.u1')
    expect(keyFor(null)).toBe('cbh.resume.v1.anon')
    expect(keyFor(undefined)).toBe('cbh.resume.v1.anon')
  })
  it('round-trips {data, updatedAt} and isolates owners', () => {
    stubMem()
    expect(loadLocal('u1')).toBeNull()
    saveLocal('u1', r1, '2025-01-01T00:00:00.000Z')
    expect(loadLocal('u1')).toMatchObject({ data: { summary: 'one' }, updatedAt: '2025-01-01T00:00:00.000Z' })
    expect(loadLocal('u2')).toBeNull()
    expect(loadLocal(null)).toBeNull()
    removeLocal('u1')
    expect(loadLocal('u1')).toBeNull()
  })
  it('migrates the legacy plain-ResumeData format with updatedAt = epoch', () => {
    stubMem()
    mem.set(keyFor(null), JSON.stringify(r1))
    expect(loadLocal(null)).toMatchObject({ data: { summary: 'one' }, updatedAt: new Date(0).toISOString() })
  })
  it('malformed / throwing storage is safe', () => {
    stubMem()
    mem.set(keyFor('u1'), '{not json')
    expect(loadLocal('u1')).toBeNull()
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') }, removeItem: () => { throw new Error('blocked') } })
    expect(loadLocal('u1')).toBeNull()
    expect(() => saveLocal('u1', r1)).not.toThrow()
    expect(() => removeLocal('u1')).not.toThrow()
  })
  it('adoptAnon moves only the anon draft to the new owner and removes the anon key', () => {
    stubMem()
    saveLocal(null, r1, '2025-01-01T00:00:00.000Z')
    saveLocal('other', r2)
    const a = adoptAnon('u1')
    expect(a?.data.summary).toBe('one')
    expect(loadLocal('u1')?.data.summary).toBe('one')
    expect(loadLocal(null)).toBeNull()
    expect(loadLocal('other')?.data.summary).toBe('two')
    expect(adoptAnon('u3')).toBeNull()
    expect(loadLocal('u3')).toBeNull()
  })
})

describe('pickResume', () => {
  const L = (at: string) => ({ data: r1, updatedAt: at })
  const R = (at: string) => ({ data: r2, updatedAt: at })
  it('local newer wins', () => expect(pickResume(L('2025-02-01T00:00:00Z'), R('2025-01-01T00:00:00Z'))).toMatchObject({ source: 'local', data: r1 }))
  it('remote newer wins', () => expect(pickResume(L('2025-01-01T00:00:00Z'), R('2025-02-01T00:00:00Z'))).toMatchObject({ source: 'remote', data: r2 }))
  it('equal -> remote', () => expect(pickResume(L('2025-01-01T00:00:00Z'), R('2025-01-01T00:00:00Z'))?.source).toBe('remote'))
  it('only one side', () => {
    expect(pickResume(L('2025-01-01T00:00:00Z'), null)?.source).toBe('local')
    expect(pickResume(null, R('2025-01-01T00:00:00Z'))?.source).toBe('remote')
    expect(pickResume(null, null)).toBeNull()
  })
  it('malformed local date counts as epoch', () => expect(pickResume(L('garbage'), R('2025-01-01T00:00:00Z'))?.source).toBe('remote'))
  it('epoch-migrated legacy local loses to any real remote date', () => expect(pickResume(L(new Date(0).toISOString()), R('2020-01-01T00:00:00Z'))?.source).toBe('remote'))
  it('legacy local with no remote is kept', () => expect(pickResume(L(new Date(0).toISOString()), null)?.source).toBe('local'))
})

describe('loadRemote', () => {
  const fake = (res: unknown) => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => (res === 'throw' ? Promise.reject(new Error('n')) : Promise.resolve(res)) }) }) }) }) as never
  it('normalizes the row with updated_at, null when none, undefined on failure', async () => {
    const r = await loadRemote(fake({ data: { data: { summary: 'db' }, updated_at: '2025-01-01T00:00:00Z' }, error: null }), 'u')
    expect(r?.data.summary).toBe('db')
    expect(r?.updatedAt).toBe('2025-01-01T00:00:00Z')
    expect(await loadRemote(fake({ data: null, error: null }), 'u')).toBeNull()
    expect(await loadRemote(fake({ data: null, error: { message: 'x' } }), 'u')).toBeUndefined()
    expect(await loadRemote(fake('throw'), 'u')).toBeUndefined()
  })
})
