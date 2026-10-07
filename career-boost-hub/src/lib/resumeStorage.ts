import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeResume, type ResumeData } from './resumeModel'

type Db = Pick<SupabaseClient, 'from'>
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
export type Stamped = { data: ResumeData; updatedAt: string }

const EPOCH = new Date(0).toISOString()
/** Local drafts are namespaced per owner so one account can never see or upload another's data. */
export const keyFor = (uid: string | null | undefined) => `cbh.resume.v1.${uid || 'anon'}`

/** Stored shape is { data, updatedAt }; the legacy plain-ResumeData shape is migrated with updatedAt = epoch. */
export function loadLocal(uid: string | null | undefined): Stamped | null {
  try {
    const raw = localStorage.getItem(keyFor(uid))
    if (!raw) return null
    const o = JSON.parse(raw) as unknown
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null
    const r = o as Record<string, unknown>
    if ('data' in r && typeof r.updatedAt === 'string') return { data: normalizeResume(r.data), updatedAt: r.updatedAt }
    return { data: normalizeResume(o), updatedAt: EPOCH }
  } catch {
    return null
  }
}

export function saveLocal(uid: string | null | undefined, data: ResumeData, updatedAt = new Date().toISOString()): void {
  try {
    localStorage.setItem(keyFor(uid), JSON.stringify({ data, updatedAt }))
  } catch {
    /* storage blocked or full: the in-memory state is still intact */
  }
}

export function removeLocal(uid: string | null | undefined): void {
  try {
    localStorage.removeItem(keyFor(uid))
  } catch {
    /* ignore */
  }
}

const ts = (s: string) => (Number.isFinite(Date.parse(s)) ? Date.parse(s) : 0)

/** Newer updatedAt wins; ties and invalid dates favour the account copy. */
export function pickResume(local: Stamped | null, remote: Stamped | null): (Stamped & { source: 'local' | 'remote' }) | null {
  if (local && (!remote || ts(local.updatedAt) > ts(remote.updatedAt))) return { ...local, source: 'local' }
  return remote ? { ...remote, source: 'remote' } : null
}

/** DB row -> Stamped; null when the user has no row; undefined when the read failed. */
export async function loadRemote(db: Db, uid: string): Promise<Stamped | null | undefined> {
  try {
    const { data, error } = await db.from('resumes').select('data, updated_at').eq('student_id', uid).maybeSingle()
    if (error) return undefined
    if (!data) return null
    const row = data as { data: unknown; updated_at?: string }
    return { data: normalizeResume(row.data), updatedAt: typeof row.updated_at === 'string' ? row.updated_at : EPOCH }
  } catch {
    return undefined
  }
}

type SaverOpts = {
  onStatus: (s: SaveStatus) => void
  /** Called once per failure streak (reset by the next success). */
  onFailure: () => void
  delay?: number
  setTimer?: (f: () => void, ms: number) => ReturnType<typeof setTimeout>
  clearTimer?: (t: ReturnType<typeof setTimeout>) => void
}

/**
 * Debounced, serialised upsert of the resume row for ONE user (uid is captured).
 * save() never throws; failures only surface via callbacks. flush() writes any pending data now.
 */
export function createSaver(db: Db, uid: string, o: SaverOpts) {
  const set = o.setTimer ?? setTimeout
  const clear = o.clearTimer ?? clearTimeout
  let timer: ReturnType<typeof setTimeout> | undefined
  let last: ResumeData | null = null
  let current: Promise<void> | null = null
  let failing = false

  const pump = (): Promise<void> => {
    if (current) return current
    current = (async () => {
      try {
        // one upsert in flight at a time; anything saved meanwhile coalesces into the next loop
        while (last) {
          const data = last
          last = null
          o.onStatus('saving')
          let failed: boolean
          try {
            const { error } = await db.from('resumes').upsert({ student_id: uid, data, updated_at: new Date().toISOString() }, { onConflict: 'student_id' })
            failed = !!error
          } catch {
            failed = true
          }
          if (failed && !failing) o.onFailure()
          failing = failed
          if (!last) o.onStatus(failed ? 'error' : 'saved')
        }
      } finally {
        current = null
      }
    })()
    return current
  }

  const stop = () => {
    if (timer !== undefined) clear(timer)
    timer = undefined
  }
  return {
    save(data: ResumeData) {
      last = data
      stop()
      timer = set(() => { timer = undefined; return pump() }, o.delay ?? 800)
    },
    /** Write pending data immediately (unmount, user change, page hide). No-op when nothing is pending. */
    flush(): Promise<boolean> {
      stop()
      // resolves true when nothing is left unsaved (no pending data and the last write succeeded)
      return (last ? pump() : (current ?? Promise.resolve())).then(() => !failing)
    },
    cancel() {
      stop()
      last = null
    },
  }
}
