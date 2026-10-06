import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
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
}

const NOT_CONFIGURED: Result = { error: 'Supabase not configured' }
const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  // loading stays true until the session is known AND (if signed in) the profile is loaded
  const [sessionReady, setSessionReady] = useState(!supabase)
  const [profileReady, setProfileReady] = useState(true)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setSessionReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = user?.id
  useEffect(() => {
    if (!supabase || !userId) {
      setProfile(null)
      setProfileReady(true)
      return
    }
    let cancelled = false
    setProfileReady(false)
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setProfile((data as Profile | null) ?? null)
        setProfileReady(true)
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

  const signOut = useCallback(async (): Promise<Result> => {
    if (!supabase) return NOT_CONFIGURED
    const { error } = await supabase.auth.signOut()
    return { error: error?.message ?? null }
  }, [])

  const value = useMemo(
    () => ({ user, profile, loading: !sessionReady || !profileReady, signIn, signUp, signOut }),
    [user, profile, sessionReady, profileReady, signIn, signUp, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
