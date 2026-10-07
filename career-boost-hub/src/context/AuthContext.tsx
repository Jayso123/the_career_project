import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type Profile = { id: string; full_name: string; role: 'student' | 'mentor' | 'admin' }
type Result = { error: string | null }

type AuthValue = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<Result>
  signUp: (email: string, password: string, fullName: string) => Promise<Result>
  signOut: () => Promise<Result>
  /** Register work to finish (awaited) before the session is dropped on sign-out. Returns an unregister fn. */
  onBeforeSignOut: (f: () => Promise<unknown> | void) => () => void
}

const NOT_CONFIGURED: Result = { error: 'Supabase not configured' }
const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  // loading stays true until the session is known AND (if signed in) the profile is loaded
  const [sessionReady, setSessionReady] = useState(!supabase)
  // id of the user whose profile fetch has finished (success or failure)
  const [profileFor, setProfileFor] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user ?? null))
      .catch((e) => console.warn('getSession failed:', e?.message))
      .finally(() => setSessionReady(true))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = user?.id
  useEffect(() => {
    if (!supabase || !userId) {
      setProfile(null)
      setProfileFor(null)
      return
    }
    let cancelled = false
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.warn('profile fetch failed:', error.message)
        setProfile((data as Profile | null) ?? null)
        setProfileFor(userId)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const signIn = useCallback(async (email: string, password: string): Promise<Result> => {
    if (!supabase) return NOT_CONFIGURED
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName: string): Promise<Result> => {
    if (!supabase) return NOT_CONFIGURED
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
    return { error: error?.message ?? null }
  }, [])

  const beforeSignOut = useRef(new Set<() => Promise<unknown> | void>())
  const onBeforeSignOut = useCallback((f: () => Promise<unknown> | void) => {
    beforeSignOut.current.add(f)
    return () => { beforeSignOut.current.delete(f) }
  }, [])
  const signOut = useCallback(async (): Promise<Result> => {
    if (!supabase) return NOT_CONFIGURED
    // flush while the session is still valid (RLS), but never block sign-out on a stalled request
    const flushed = Promise.allSettled([...beforeSignOut.current].map(async (f) => f()))
    let cap: ReturnType<typeof setTimeout> | undefined
    await Promise.race([flushed, new Promise((r) => { cap = setTimeout(r, 4000) })])
    clearTimeout(cap)
    const { error } = await supabase.auth.signOut()
    return { error: error?.message ?? null }
  }, [])

  const value = useMemo(
    () => ({ user, profile, loading: !sessionReady || (!!user && profileFor !== user.id), signIn, signUp, signOut, onBeforeSignOut }),
    [user, profile, sessionReady, profileFor, signIn, signUp, signOut, onBeforeSignOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
