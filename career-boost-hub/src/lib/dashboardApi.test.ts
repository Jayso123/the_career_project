import { describe, expect, it } from 'vitest'
import { addItem, cancelSession, createGuard, deleteItem, fetchItems, fetchSessions, insertMany, optimistic, toggleDone } from './dashboardApi'

type Res = { data?: unknown; error?: unknown }
// chainable fake db: result per "table.op"; records calls; a throw result simulates a network failure
function fake(res: Record<string, Res | 'throw'> = {}) {
  const calls: unknown[][] = []
  const db = {
    from: (t: string) => {
      let op = 'select'
      const chain: Record<string, unknown> = {}
      const settle = () => {
        const r = res[`${t}.${op}`]
        if (r === 'throw') return Promise.reject(new Error('network'))
        return Promise.resolve({ data: null, error: null, ...(r ?? {}) })
      }
      for (const m of ['select', 'eq', 'order']) chain[m] = (...a: unknown[]) => (calls.push([t, m, ...a]), chain)
      for (const m of ['insert', 'update', 'delete'])
        chain[m] = (...a: unknown[]) => ((op = m), calls.push([t, m, ...a]), chain)
      chain.single = settle
      chain.then = (f: never, g: never) => settle().then(f, g)
      return chain
    },
  }
  return { db: db as never, calls }
}

describe('optimistic', () => {
  const run = async (result: () => Promise<{ error: unknown }>) => {
    let list = [{ id: 1, done: false }]
    const set = (f: (l: typeof list) => typeof list) => (list = f(list))
    const ok = await optimistic(set, (l) => l.map((x) => ({ ...x, done: true })), (l) => l.map((x) => ({ ...x, done: false })), result)
    return { ok, list }
  }
  it('keeps the change on success', async () => {
    expect(await run(async () => ({ error: null }))).toEqual({ ok: true, list: [{ id: 1, done: true }] })
  })
  it('rolls back when the server returns an error', async () => {
    expect(await run(async () => ({ error: { message: 'rls' } }))).toEqual({ ok: false, list: [{ id: 1, done: false }] })
  })
  it('rolls back when the request throws', async () => {
    expect(await run(() => Promise.reject(new Error('network')))).toEqual({ ok: false, list: [{ id: 1, done: false }] })
  })
})

describe('createGuard', () => {
  it('ignores a second call for the same key while in flight, then allows again', async () => {
    const g = createGuard()
    let n = 0
    let release!: () => void
    const slow = () => new Promise<void>((r) => (release = r)).then(() => ++n)
    const a = g('x', slow)
    const b = await g('x', slow)
    expect(b).toBeUndefined()
    release()
    await a
    expect(n).toBe(1)
    const c = g('x', async () => 'again')
    expect(await c).toBe('again')
  })
  it('frees the key when the task throws', async () => {
    const g = createGuard()
    await expect(g('k', () => Promise.reject(new Error('x')))).rejects.toThrow()
    expect(await g('k', async () => 1)).toBe(1)
  })
})

describe('api calls', () => {
  it('toggleDone updates the row by id and reports errors', async () => {
    const { db, calls } = fake({ 'milestones.update': { error: { message: 'x' } } })
    expect(await toggleDone(db, 'milestones', 'm1', true)).toBeTruthy()
    expect(calls).toContainEqual(['milestones', 'update', { done: true }])
    expect(calls).toContainEqual(['milestones', 'eq', 'id', 'm1'])
  })
  it('cancelSession sets status=cancelled; throw becomes an error', async () => {
    const ok = fake()
    expect(await cancelSession(ok.db, 's1')).toBeNull()
    expect(ok.calls).toContainEqual(['sessions', 'update', { status: 'cancelled' }])
    expect(await cancelSession(fake({ 'sessions.update': 'throw' }).db, 's1')).toBeTruthy()
  })
  it('deleteItem and insertMany surface errors', async () => {
    expect(await deleteItem(fake({ 'roadmap_items.delete': { error: { message: 'x' } } }).db, 'roadmap_items', 'r1')).toBeTruthy()
    const f = fake({ 'roadmap_items.insert': { data: [{ id: 'a' }, { id: 'b' }] } })
    const r = await insertMany(f.db, 'roadmap_items', 'u1', [{ title: 'A', detail: '', due_on: '2026-10-20' }])
    expect(r.error).toBeNull()
    expect(r.data).toHaveLength(2)
    expect(f.calls).toContainEqual(['roadmap_items', 'insert', [{ title: 'A', detail: '', due_on: '2026-10-20', student_id: 'u1' }]])
    expect((await insertMany(fake({ 'roadmap_items.insert': 'throw' }).db, 'roadmap_items', 'u1', [])).error).toBeTruthy()
  })
  it('addItem returns the inserted row, or an error', async () => {
    const f = fake({ 'milestones.insert': { data: { id: 'n', title: 'T' } } })
    expect((await addItem(f.db, 'milestones', 'u1', { title: 'T', due_on: null })).data).toMatchObject({ id: 'n' })
    expect((await addItem(fake({ 'milestones.insert': { error: { message: 'x' } } }).db, 'milestones', 'u1', { title: 'T', due_on: null })).error).toBeTruthy()
  })
  it('fetchSessions scopes to the student and maps errors', async () => {
    const f = fake({ 'sessions.select': { data: [{ id: 's' }] } })
    expect((await fetchSessions(f.db, 'u1')).data).toHaveLength(1)
    expect(f.calls).toContainEqual(['sessions', 'eq', 'student_id', 'u1'])
    expect((await fetchSessions(fake({ 'sessions.select': 'throw' }).db, 'u1')).error).toBeTruthy()
  })
  it('fetchItems selects created_at and orders by due_on (nulls last) then created_at', async () => {
    for (const t of ['roadmap_items', 'milestones'] as const) {
      const f = fake({ [`${t}.select`]: { data: [] } })
      await fetchItems(f.db, t, 'u1')
      expect(f.calls[0]?.[2]).toMatch(/created_at/)
      expect(f.calls).toContainEqual([t, 'eq', 'student_id', 'u1'])
      const orders = f.calls.filter((c) => c[1] === 'order').map((c) => c.slice(2))
      expect(orders).toEqual([['due_on', { ascending: true, nullsFirst: false }], ['created_at', { ascending: true }]])
    }
  })
})
