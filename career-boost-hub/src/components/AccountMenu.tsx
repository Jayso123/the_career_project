import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { buttonVariants } from './ui/button'
import { cn } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

const item =
  'block w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-accent/10 hover:text-accent transition-colors'

/** Signed-in replacement for the navbar Login button. `scrolled` mirrors the navbar's transparent/solid states. */
export default function AccountMenu({ scrolled, block, onNavigate }: { scrolled: boolean; block?: boolean; onNavigate?: () => void }) {
  const { user, profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const name = profile?.full_name || user?.email || 'Account'

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const done = () => {
    setOpen(false)
    onNavigate?.()
  }

  return (
    <div ref={ref} className={cn('relative', block && 'w-full mt-4')}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'lg' }),
          'max-w-[200px]',
          block && 'w-full max-w-none',
          !scrolled &&
            !block &&
            'border-primary-foreground/80 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground',
        )}
      >
        <span className="truncate">{name}</span>
        <ChevronDown className="w-4 h-4 shrink-0" />
      </button>
      {open && (
        <div className={cn('z-50 mt-2 bg-card rounded-xl shadow-xl border border-border p-2', block ? 'w-full' : 'absolute right-0 w-56')}>
          <p className="px-3 py-2 text-xs text-muted-foreground truncate">{user?.email}</p>
          <Link to="/dashboard" onClick={done} className={item}>
            Dashboard
          </Link>
          {profile?.role === 'admin' && (
            <Link to="/admin" onClick={done} className={item}>
              Admin
            </Link>
          )}
          <button
            type="button"
            className={item}
            onClick={async () => {
              await signOut()
              done()
              navigate('/')
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
