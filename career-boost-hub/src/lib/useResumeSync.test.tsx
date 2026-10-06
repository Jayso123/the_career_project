// @vitest-environment jsdom
import { StrictMode, type ReactNode } from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { emptyResume, type ResumeData } from './resumeModel'
import { keyFor, loadLocal, saveLocal } from './resumeStorage'
import { useResumeSync } from './useResumeSync'

const resume = (summary: string): ResumeData => ({ ...emptyResume(), summary })
const OLD = '2025-01-01T00:00:00.000Z'
const NEW = '2026-01-01T00:00:00.000Z'

/** Fake supabase: one remote row per student, gated reads, session-aware (RLS) upserts. */
function fakeDb() {
  const rows = new Map<string, { data: ResumeData; updated_at: string }>()
  const upserts: { uid: string; summary: string }[] = []
  const order: string[] = []
  const state = { sessionAlive: true, readFails: 0, gate: null as Promise<void> | null, upsertFails: false }
  const db = {
    from: () => ({
      select: () => ({
        eq: (_c: string, uid: string) => ({
          maybeSingle: async () => {
            if (state.gate) await state.gate
            if (state.readFails > 0) { state.readFails--; return { data: null, error: { message: 'net' } } }
            return { data: rows.get(uid) ?? null, error: null }
          },
        }),
      }),
      upsert: async (row: { student_id: string; data: ResumeData; updated_at: string }) => {
        if (!state.sessionAlive || state.upsertFails) return { error: { message: 'rls' } }
        upserts.push({ uid: row.student_id, summary: row.data.summary })
        order.push('upsert')
        rows.set(row.student_id, { data: row.data, updated_at: row.updated_at })
        return { error: null }
      },
    }),
  }
  return { db: db as never, rows, upserts, state, order }
}

function setup(initial: { uid: string | null; authLoading?: boolean }, f = fakeDb(), strict = true) {
  const callbacks = new Set<() => Promise<unknown> | void>()
  const onBeforeSignOut = (cb: () => Promise<unknown> | void) => { callbacks.add(cb); return () => void callbacks.delete(cb) }
  const onFailure = vi.fn()
  const wrapper = strict ? ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode> : undefined
  const hook = renderHook(
    (p: { uid: string | null; authLoading?: boolean }) => useResumeSync({ uid: p.uid, authLoading: !!p.authLoading, db: f.db, onBeforeSignOut, onFailure }),
    { initialProps: initial, wrapper },
  )
  const order = f.order
  const signOut = async () => {
    await Promise.allSettled([...callbacks].map(async (cb) => cb()))
    order.push('dropped')
    f.state.sessionAlive = false
    hook.rerender({ uid: null })
  }
  return { ...f, hook, order, signOut, onFailure, callbacks }
}
const tick = (ms = 1500) => act(() => vi.advanceTimersByTimeAsync(ms))
const edit = (t: ReturnType<typeof setup>, summary: string) => act(() => t.hook.result.current.set((d) => ({ ...d, summary })))

beforeEach(() => { localStorage.clear(); vi.useFakeTimers() })
afterEach(() => { cleanup(); vi.useRealTimers() })

describe('useResumeSync', () => {
  it('N1: mounting signed-in with a slow read writes nothing until the user edits, and shows the remote resume (StrictMode)', async () => {
    const f = fakeDb()
    f.rows.set('u1', { data: resume('remote'), updated_at: OLD })
    let release!: () => void
    f.state.gate = new Promise((r) => { release = r })
    const t = setup({ uid: 'u1' }, f)
    await tick(2000)
    expect(t.hook.result.current.sync).toBe('loading')
    expect(localStorage.getItem(keyFor('u1'))).toBeNull()
    expect(t.upserts).toEqual([])
    release()
    await tick(2000)
    expect(t.hook.result.current.sync).toBe('ready')
    expect(t.hook.result.current.data.summary).toBe('remote')
    expect(t.upserts).toEqual([])
    expect(loadLocal('u1')).toMatchObject({ updatedAt: OLD, data: { summary: 'remote' } }) // original stamp, not "now"
    await edit(t, 'mine')
    await tick(2000)
    expect(t.upserts).toEqual([{ uid: 'u1', summary: 'mine' }])
  })

  it('signed-out mount never persists the untouched empty resume', async () => {
    const t = setup({ uid: null })
    await tick(2000)
    expect(localStorage.length).toBe(0)
    await edit(t, 'x')
    await tick(500)
    expect(loadLocal(null)?.data.summary).toBe('x')
  })

  it('N1b: a failed read keeps auto-save off; Retry never uploads an unedited empty draft', async () => {
    const f = fakeDb()
    f.state.readFails = 1
    const t = setup({ uid: 'u1' }, f)
    await tick(2000)
    expect(t.hook.result.current.sync).toBe('failed')
    expect(t.upserts).toEqual([])
    expect(localStorage.getItem(keyFor('u1'))).toBeNull()
    act(() => t.hook.result.current.retry())
    await tick(2000)
    expect(t.hook.result.current.sync).toBe('ready')
    expect(t.upserts).toEqual([])
    expect(localStorage.getItem(keyFor('u1'))).toBeNull()
  })

  it('a real local draft is uploaded after a successful retry', async () => {
    const f = fakeDb()
    f.state.readFails = 1
    saveLocal('u1', resume('draft'), NEW)
    const t = setup({ uid: 'u1' }, f)
    await tick(2000)
    expect(t.hook.result.current.data.summary).toBe('draft')
    expect(t.upserts).toEqual([])
    act(() => t.hook.result.current.retry())
    await tick(2000)
    expect(t.upserts).toEqual([{ uid: 'u1', summary: 'draft' }])
  })

  it('N2: sign-out flushes the last edit under the old uid BEFORE the session drops; local copy removed only after success', async () => {
    const t = setup({ uid: 'u1' })
    await tick(2000)
    await edit(t, 'last words')
    await act(() => t.signOut())
    await tick(2000)
    expect(t.upserts).toEqual([{ uid: 'u1', summary: 'last words' }])
    expect(t.order).toEqual(['upsert', 'dropped']) // the upsert really happened before the session dropped
    expect(localStorage.getItem(keyFor('u1'))).toBeNull()
    expect(t.hook.result.current.data.summary).toBe('')
  })

  it('N2b: if the final flush fails the local copy is kept', async () => {
    const t = setup({ uid: 'u1' })
    await tick(2000)
    await edit(t, 'precious')
    t.state.upsertFails = true
    await act(() => t.signOut())
    await tick(2000)
    expect(t.upserts).toEqual([])
    expect(loadLocal('u1')?.data.summary).toBe('precious')
    expect(t.onFailure).toHaveBeenCalledTimes(1)
  })

  it('N3: a newer anon draft beats an older account row (and is uploaded); an older anon draft loses; anon key is consumed either way', async () => {
    const f = fakeDb()
    f.rows.set('u1', { data: resume('acct'), updated_at: OLD })
    saveLocal(null, resume('anon-new'), NEW)
    let t = setup({ uid: 'u1' }, f)
    await tick(2000)
    expect(t.hook.result.current.data.summary).toBe('anon-new')
    expect(f.upserts).toEqual([{ uid: 'u1', summary: 'anon-new' }])
    expect(localStorage.getItem(keyFor(null))).toBeNull()
    cleanup(); localStorage.clear()

    const g = fakeDb()
    g.rows.set('u1', { data: resume('acct'), updated_at: NEW })
    saveLocal(null, resume('anon-old'), OLD)
    t = setup({ uid: 'u1' }, g)
    await tick(2000)
    expect(t.hook.result.current.data.summary).toBe('acct')
    expect(g.upserts).toEqual([])
    expect(localStorage.getItem(keyFor(null))).toBeNull()
  })

  it('N3: A signs out, B (no row) signs in -> B starts empty and never inherits A data', async () => {
    saveLocal(null, resume('pre-login'), NEW)
    const t = setup({ uid: 'u1' })
    await tick(2000)
    expect(t.hook.result.current.data.summary).toBe('pre-login') // A adopted the anon draft
    await act(() => t.signOut())
    await tick(1000)
    t.state.sessionAlive = true
    t.hook.rerender({ uid: 'u2' })
    await tick(2000)
    expect(t.hook.result.current.data.summary).toBe('')
    expect(t.upserts.filter((u) => u.uid === 'u2')).toEqual([])
    expect(loadLocal('u2')).toBeNull()
  })

  it('N4: while auth is loading the skeleton state is kept and nothing is touched', async () => {
    const t = setup({ uid: null, authLoading: true })
    await tick(2000)
    expect(t.hook.result.current.sync).toBe('loading')
    expect(localStorage.length).toBe(0)
  })

  it('N5: direct A->B switch never saves A data under B and removes A local copy after A is flushed', async () => {
    const f = fakeDb()
    const t = setup({ uid: 'u1' }, f)
    await tick(2000)
    await edit(t, 'A-data')
    t.hook.rerender({ uid: 'u2' })
    await tick(2500)
    expect(t.hook.result.current.data.summary).toBe('')
    expect(f.upserts).toEqual([{ uid: 'u1', summary: 'A-data' }])
    expect(localStorage.getItem(keyFor('u1'))).toBeNull()
    await edit(t, 'B-data')
    await tick(2000)
    expect(f.upserts).toEqual([{ uid: 'u1', summary: 'A-data' }, { uid: 'u2', summary: 'B-data' }])
    expect(loadLocal('u2')?.data.summary).toBe('B-data')
  })

  it('OPEN1(i): an edit while the read is in flight is rejected; nothing stale is written or uploaded', async () => {
    const f = fakeDb()
    f.rows.set('u1', { data: resume('acct'), updated_at: OLD })
    let release!: () => void
    f.state.gate = new Promise((r) => { release = r })
    const t = setup({ uid: 'u1' }, f)
    await tick(300)
    await act(() => t.hook.result.current.set((d) => ({ ...d, template: 'modern' })))
    release()
    await tick(2000)
    expect(f.upserts).toEqual([])
    expect(t.hook.result.current.data).toMatchObject({ summary: 'acct', template: 'classic' })
    expect(loadLocal('u1')).toMatchObject({ updatedAt: OLD, data: { summary: 'acct' } })
  })

  it('OPEN1(ii): read resolves first, then timers advance: no stale pending write survives the load', async () => {
    const f = fakeDb()
    f.rows.set('u1', { data: resume('acct'), updated_at: OLD })
    let release!: () => void
    f.state.gate = new Promise((r) => { release = r })
    const t = setup({ uid: 'u1' }, f)
    await tick(100)
    await act(() => t.hook.result.current.set((d) => ({ ...d, template: 'modern' })))
    release()
    await tick(0) // load applied, 200 ms timer would not have fired yet
    expect(t.hook.result.current.data.template).toBe('classic')
    await tick(2000)
    expect(f.upserts).toEqual([])
    expect(loadLocal('u1')).toMatchObject({ updatedAt: OLD, data: { summary: 'acct', template: 'classic' } })
  })

  it('OPEN1(iii): edits are accepted again once ready, and in the failed state', async () => {
    const f = fakeDb()
    const t = setup({ uid: 'u1' }, f)
    await tick(2000)
    await edit(t, 'ready edit')
    await tick(2000)
    expect(f.upserts).toEqual([{ uid: 'u1', summary: 'ready edit' }])
    cleanup(); localStorage.clear()
    const g = fakeDb()
    g.state.readFails = 1
    const u = setup({ uid: 'u1' }, g)
    await tick(2000)
    expect(u.hook.result.current.sync).toBe('failed')
    await edit(u, 'offline edit')
    await tick(500)
    expect(loadLocal('u1')?.data.summary).toBe('offline edit')
    expect(g.upserts).toEqual([])
  })

  it('direct A->B switch: A flush failure does not toast B', async () => {
    const f = fakeDb()
    const t = setup({ uid: 'u1' }, f)
    await tick(2000)
    await edit(t, 'A-data')
    f.state.upsertFails = true
    t.hook.rerender({ uid: 'u2' })
    await tick(2000)
    expect(t.onFailure).not.toHaveBeenCalled()
  })
})
