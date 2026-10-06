import { useCallback, useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { emptyResume, type ResumeData } from './resumeModel'
import { createSaver, loadLocal, loadRemote, pickResume, removeLocal, saveLocal, type SaveStatus } from './resumeStorage'

type Db = Pick<SupabaseClient, 'from'>
export type SyncDeps = {
  uid: string | null
  authLoading: boolean
  db: Db | null
  /** Registers a callback that runs (and is awaited) before the session is dropped; returns an unregister fn. */
  onBeforeSignOut: (f: () => Promise<unknown> | void) => () => void
  onFailure: () => void
}

/**
 * Resume state + persistence lifecycle (local draft, account copy, owner switches).
 * Invariants: only user edits (via `set`) are ever persisted or uploaded; loads never are.
 */
export function useResumeSync({ uid, authLoading, db, onBeforeSignOut, onFailure }: SyncDeps) {
  const [data, setData] = useState<ResumeData>(emptyResume)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [sync, setSync] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [rev, setRev] = useState(0) // remounts uncontrolled inputs after a programmatic load / reset
  const saver = useRef<ReturnType<typeof createSaver> | null>(null)
  const owner = useRef<string | null | undefined>(undefined) // whose data is in state; undefined until auth settles
  const dirty = useRef(false) // set only by user edits
  const pending = useRef<{ uid: string | null; data: ResumeData; at: string } | null>(null)
  const localTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const ready = useRef(false) // false while the saved copy is unknown: an edit now would be stamped newer than the account row and overwrite it
  const lastFlush = useRef<Promise<boolean> | null>(null)
  const failure = useRef(onFailure)
  failure.current = onFailure

  const flushLocal = useCallback(() => {
    clearTimeout(localTimer.current)
    if (pending.current) saveLocal(pending.current.uid, pending.current.data, pending.current.at)
    pending.current = null
  }, [])
  const load = (d: ResumeData) => {
    // a load replaces the state: no write queued for the previous state may survive it (owner changes flush in cleanup first)
    clearTimeout(localTimer.current)
    pending.current = null
    dirty.current = false
    setData(d)
    setRev((r) => r + 1)
  }
  const set = useCallback((f: (d: ResumeData) => ResumeData) => {
    if (!ready.current) return
    dirty.current = true
    setData(f)
  }, [])
  const reset = useCallback(() => { set(() => emptyResume()); setRev((r) => r + 1) }, [set])
  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  // Owner switch + initial load. Cleanup FLUSHES (never cancels) the previous owner's pending writes.
  useEffect(() => {
    if (authLoading) { ready.current = false; setSync('loading'); return }
    const prev = owner.current
    if (typeof prev === 'string' && prev !== uid) {
      // sign-out or direct account switch: drop the previous owner's local copy, but only once their data is safely upstream
      const f = lastFlush.current
      void f?.then((ok) => ok && removeLocal(prev))
    }
    lastFlush.current = null
    owner.current = uid
    setStatus('idle')
    ready.current = false
    load(loadLocal(uid)?.data ?? emptyResume())
    if (!uid || !db) { ready.current = true; setSync('ready'); return }
    setSync('loading')
    let live = true
    void loadRemote(db, uid).then((remote) => {
      if (!live) return
      if (remote === undefined) { ready.current = true; setSync('failed'); return } // keep the local draft; auto-save stays off so the DB row can't be overwritten
      const own = loadLocal(uid)
      const anon = loadLocal(null)
      removeLocal(null) // the pre-login draft belongs to the first account that loads; never left for the next one
      const lp = pickResume(anon, own) // anon wins only if strictly newer
      const pick = pickResume(lp && { data: lp.data, updatedAt: lp.updatedAt }, remote)
      if (pick) {
        load(pick.data)
        saveLocal(uid, pick.data, pick.updatedAt)
      }
      saver.current = createSaver(db, uid, { onStatus: (s) => live && setStatus(s), onFailure: () => {
        if (owner.current === uid) failure.current()
        else console.warn("resume: could not save the previous account's last edits; they are kept in this browser") // never toast the new owner
      },
    })
      if (pick?.source === 'local') saver.current.save(pick.data)
      ready.current = true
      setSync('ready')
    })
    return () => {
      live = false
      flushLocal()
      lastFlush.current = saver.current?.flush() ?? null
      saver.current = null
    }
  }, [uid, authLoading, attempt, db, flushLocal])

  // User edits only: debounced local copy (200 ms) + debounced DB upsert.
  useEffect(() => {
    if (!dirty.current || owner.current === undefined) return
    dirty.current = false
    pending.current = { uid: owner.current, data, at: new Date().toISOString() }
    clearTimeout(localTimer.current)
    localTimer.current = setTimeout(flushLocal, 200)
    saver.current?.save(data)
  }, [data, flushLocal])

  // Flush before the session is dropped (RLS would reject the upsert afterwards).
  useEffect(() => onBeforeSignOut(() => { flushLocal(); return saver.current?.flush() }), [onBeforeSignOut, flushLocal])

  useEffect(() => {
    const hide = () => { flushLocal(); void saver.current?.flush() }
    const vis = () => document.visibilityState === 'hidden' && hide()
    window.addEventListener('pagehide', hide)
    document.addEventListener('visibilitychange', vis)
    return () => {
      window.removeEventListener('pagehide', hide)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [flushLocal])

  return { data, set, reset, status, sync, retry, rev }
}
