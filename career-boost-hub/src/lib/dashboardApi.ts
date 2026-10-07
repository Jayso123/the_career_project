import type { SupabaseClient } from '@supabase/supabase-js'

type Db = Pick<SupabaseClient, 'from'>
type Table = 'roadmap_items' | 'milestones'
type Err = unknown | null

export type SessionRow = {
  id: string
  starts_at: string
  plan: string
  requirements: string
  status: 'booked' | 'completed' | 'cancelled'
  mentor: { name: string; title: string } | null
}
export type Item = { id: string; title: string; detail?: string; due_on: string | null; done: boolean }
export type NewItem = { title: string; detail?: string; due_on: string | null }

const COLS: Record<Table, string> = { roadmap_items: 'id, title, detail, due_on, done', milestones: 'id, title, due_on, done' }

// Every call below resolves to { data, error } / error; none throws, so UI state can never stick on a rejected promise.
export async function safe<T>(f: () => PromiseLike<{ data?: T | null; error: Err }>): Promise<{ data: T | null; error: Err }> {
  try {
    const r = await f()
    return { data: r.error ? null : (r.data ?? null), error: r.error ?? null }
  } catch (e) {
    return { data: null, error: e }
  }
}

export async function fetchSessions(db: Db, uid: string) {
  const r = await safe<Record<string, unknown>[]>(() =>
    db.from('sessions').select('id, starts_at, plan, requirements, status, mentors(name, title)').eq('student_id', uid).order('starts_at') as never,
  )
  const data = r.data?.map(({ mentors, ...s }) => ({ ...s, mentor: (Array.isArray(mentors) ? mentors[0] : mentors) ?? null }) as SessionRow) ?? null
  return { data, error: r.error }
}

export const fetchItems = (db: Db, table: Table, uid: string) =>
  safe<Item[]>(() => {
    const q = db.from(table).select(`${COLS[table]}, created_at`).eq('student_id', uid)
    return (table === 'milestones' ? q.eq('kind', 'interview_prep') : q)
      .order('due_on', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }) as never
  })

export const toggleDone = async (db: Db, table: Table, id: string, done: boolean): Promise<Err> =>
  (await safe(() => db.from(table).update({ done }).eq('id', id) as never)).error

export const deleteItem = async (db: Db, table: Table, id: string): Promise<Err> =>
  (await safe(() => db.from(table).delete().eq('id', id) as never)).error

export const cancelSession = async (db: Db, id: string): Promise<Err> =>
  (await safe(() => db.from('sessions').update({ status: 'cancelled' }).eq('id', id) as never)).error

export const addItem = (db: Db, table: Table, uid: string, item: NewItem) =>
  safe<Item>(() => db.from(table).insert({ ...item, student_id: uid }).select(COLS[table]).single() as never)

export const insertMany = (db: Db, table: Table, uid: string, items: NewItem[]) =>
  safe<Item[]>(() => db.from(table).insert(items.map((i) => ({ ...i, student_id: uid }))).select(COLS[table]) as never)

/** Apply `forward` to the list now; if `run` errors or throws, apply `undo`. Returns whether it stuck. */
export async function optimistic<T>(
  set: (f: (l: T[]) => T[]) => void,
  forward: (l: T[]) => T[],
  undo: (l: T[]) => T[],
  run: () => Promise<{ error: Err }>,
): Promise<boolean> {
  set(forward)
  let error: Err
  try {
    error = (await run()).error
  } catch (e) {
    error = e
  }
  if (error) set(undo)
  return !error
}

/** One in-flight task per key; a repeat call while busy resolves undefined without running. */
export function createGuard() {
  const busy = new Set<string>()
  return async <T>(key: string, task: () => Promise<T>): Promise<T | undefined> => {
    if (busy.has(key)) return undefined
    busy.add(key)
    try {
      return await task()
    } finally {
      busy.delete(key)
    }
  }
}
