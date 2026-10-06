import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Rocket } from 'lucide-react'
import { z } from 'zod'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import ConnectSupabase from '../components/ConnectSupabase'
import { useAuth } from '../context/AuthContext'
import { redirectState, redirectTarget } from '../lib/redirectTarget'
import { supabase } from '../lib/supabase'

const labelClass = 'block text-sm font-medium text-foreground mb-2'
const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
const signupSchema = loginSchema.extend({ fullName: z.string().trim().min(2, 'Enter your full name') })

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup'
  const { user, loading, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const to = redirectTarget(location.state)

  if (!loading && user) return <Navigate to={to} replace state={redirectState(location.state)} />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    const parsed = (isSignup ? signupSchema : loginSchema).safeParse(form)
    if (!parsed.success) return setError(parsed.error.issues[0].message)
    setBusy(true)
    const { error: err } = isSignup
      ? await signUp(form.email.trim(), form.password, form.fullName.trim())
      : await signIn(form.email.trim(), form.password)
    setBusy(false)
    if (err) return setError(err)
    if (isSignup) setNotice('Account created. If email confirmation is enabled, check your inbox, then log in.')
    else navigate(to, { replace: true, state: redirectState(location.state) })
  }

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <Link to="/" className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-md">
            <Rocket className="w-5 h-5 text-accent-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            Career<span className="text-accent">Boost</span>
          </span>
        </Link>
        {!supabase && <ConnectSupabase />}
        <div className="card-elevated p-6 lg:p-8">
          <h1 className="font-display text-xl font-bold text-foreground mb-6">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {isSignup && (
              <div>
                <label htmlFor="fullName" className={labelClass}>Full Name</label>
                <Input id="fullName" autoComplete="name" value={form.fullName} onChange={set('fullName')} placeholder="Enter your name" className="h-12" />
              </div>
            )}
            <div>
              <label htmlFor="email" className={labelClass}>Email Address</label>
              <Input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className="h-12" />
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <Input
                id="password"
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={form.password}
                onChange={set('password')}
                placeholder="At least 8 characters"
                className="h-12"
              />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {notice && <p role="status" className="text-sm text-accent">{notice}</p>}
            <Button type="submit" variant="highlight" size="lg" className="w-full" disabled={busy}>
              {busy ? 'Please wait...' : isSignup ? 'Sign Up' : 'Log In'}
            </Button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground text-center">
            {isSignup ? 'Already have an account?' : 'New here?'}{' '}
            <Link to={isSignup ? '/login' : '/signup'} state={location.state} className="text-accent font-medium hover:underline">
              {isSignup ? 'Log in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
