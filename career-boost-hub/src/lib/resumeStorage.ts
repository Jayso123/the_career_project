import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeResume, type ResumeData } from './resumeModel'

type Db = Pick<SupabaseClient, 'from'>
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
const KEY = 'cbh.resume.v1'

export function loadLocal(): ResumeData | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? normalizeResume(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function saveLocal(d: ResumeData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch {
    /* storage blocked or full: the in-memory state is still intact */
  }
}

/** DB row -> ResumeData; null when the user has no row; undefined when the read failed. */
export async function loadRemote(db: Db, uid: string): Promise<ResumeData | null | undefined> {
  try {
    const { data, error } = await db.from('resumes').select('data').eq('student_id', uid).maybeSingle()
    if (error) return undefined
    return data ? normalizeResume((data as { data: unknown }).data) : null
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

/** Debounced upsert of the resume row. save() never throws; failures only surface via callbacks. */
export function createSaver(db: Db, uid: string, o: SaverOpts) {
  const set = o.setTimer ?? setTimeout
  const clear = o.clearTimer ?? clearTimeout
  let timer: ReturnType<typeof setTimeout> | undefined
  let failing = false
  const run = async (data: ResumeData) => {
    o.onStatus('saving')
    let failed: boolean
    try {
      const { error } = await db.from('resumes').upsert({ student_id: uid, data, updated_at: new Date().toISOString() }, { onConflict: 'student_id' })
      failed = !!error
    } catch {
      failed = true
    }
    if (failed) {
      if (!failing) o.onFailure()
      failing = true
      o.onStatus('error')
    } else {
      failing = false
      o.onStatus('saved')
    }
  }
  return {
    save(data: ResumeData) {
      if (timer !== undefined) clear(timer)
      timer = set(() => { timer = undefined; return run(data) }, o.delay ?? 800)
    },
    cancel() {
      if (timer !== undefined) clear(timer)
      timer = undefined
    },
  }
}
