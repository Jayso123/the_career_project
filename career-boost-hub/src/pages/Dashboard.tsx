import { useCallback, useEffect, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Circle, Loader2, Plus, Trash2 } from 'lucide-react'
import Navbar from '../components/clone/Navbar'
import ConnectSupabase from '../components/ConnectSupabase'
import { Button, buttonVariants } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { useToast } from '../components/ui/use-toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import {
  addItem, cancelSession, createGuard, deleteItem, fetchItems, fetchSessions, insertMany, optimistic, toggleDone,
  type Item, type SessionRow,
} from '../lib/dashboardApi'
import { formatIst, isOverdue, progress, sortByDue, splitSessions, todayLocal } from '../lib/dashboardLogic'
import { CAREER_PATHS, starterRoadmap } from '../lib/starterRoadmap'

type Table = 'roadmap_items' | 'milestones'
const MAX_TITLE = 120

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-xl border bg-card p-6 shadow-sm">
    <h2 className="font-display text-xl font-bold text-foreground mb-4">{title}</h2>
    {children}
  </section>
)
const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-muted-foreground">{children}</p>
const Badge = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', className)}>{children}</span>
)

/** One in-flight action per key, exposed as `pending` so buttons can disable. */
function usePending() {
  const guard = useRef(createGuard()).current
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set())
  const run = useCallback(
    <T,>(key: string, task: () => Promise<T>) =>
      guard(key, async () => {
        setPending((p) => new Set(p).add(key))
        try {
          return await task()
        } finally {
          setPending((p) => {
            const n = new Set(p)
            n.delete(key)
            return n
          })
        }
      }),
    [guard],
  )
  return { pending, run }
}

function Skeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border bg-card p-6 animate-pulse space-y-3">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

const STATUS_STYLE: Record<string, string> = {
  booked: 'bg-accent/10 text-accent',
  completed: 'bg-secondary text-secondary-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
}

function SessionItem({ s, onCancel, busy }: { s: SessionRow; onCancel?: () => void; busy?: boolean }) {
  return (
    <li className="rounded-lg border p-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1 min-w-0">
        <p className="font-semibold text-foreground">
          {s.mentor?.name ?? 'Mentor'}
          {s.mentor?.title && <span className="font-normal text-muted-foreground"> · {s.mentor.title}</span>}
        </p>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 shrink-0" />
          {formatIst(s.starts_at)}
        </p>
        {s.requirements && <p className="text-sm text-muted-foreground line-clamp-2 break-words">{s.requirements}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge className="bg-primary/10 text-primary">{s.plan}</Badge>
        <Badge className={STATUS_STYLE[s.status]}>{s.status}</Badge>
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}Cancel
          </Button>
        )}
      </div>
    </li>
  )
}

function SessionsCard({ sessions, setSessions }: { sessions: SessionRow[]; setSessions: Dispatch<SetStateAction<SessionRow[]>> }) {
  const { toast } = useToast()
  const { pending, run } = usePending()
  const [confirm, setConfirm] = useState<SessionRow | null>(null)
  const { upcoming, past } = splitSessions(sessions, new Date())

  const doCancel = (s: SessionRow) => {
    setConfirm(null)
    void run('s:' + s.id, async () => {
      const set = (st: SessionRow['status']) => (l: SessionRow[]) => l.map((x) => (x.id === s.id ? { ...x, status: st } : x))
      const ok = await optimistic(setSessions, set('cancelled'), set(s.status), async () => ({ error: await cancelSession(supabase!, s.id) }))
      if (!ok) toast({ title: 'Could not cancel the session', description: 'Please try again.', variant: 'destructive' })
    })
  }

  return (
    <Card title="Mentorship sessions">
      {sessions.length === 0 ? (
        <div className="space-y-3">
          <Empty>You have no sessions yet.</Empty>
          <Link to="/#pricing" className={buttonVariants({ variant: 'accent' })}>Book a session</Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Upcoming</h3>
            {upcoming.length ? (
              <ul className="space-y-3">
                {upcoming.map((s) => (
                  <SessionItem key={s.id} s={s} busy={pending.has('s:' + s.id)} onCancel={() => setConfirm(s)} />
                ))}
              </ul>
            ) : (
              <Empty>No upcoming sessions. <Link to="/#pricing" className="text-accent hover:underline">Book a session</Link></Empty>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Past &amp; cancelled</h3>
            {past.length ? (
              <ul className="space-y-3">{past.map((s) => <SessionItem key={s.id} s={s} />)}</ul>
            ) : (
              <Empty>Nothing here yet.</Empty>
            )}
          </div>
        </div>
      )}
      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this session?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirm && `${confirm.mentor?.name ?? 'Your mentor'} on ${formatIst(confirm.starts_at)}. The slot will be released.`}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirm(null)}>Keep session</Button>
            <Button variant="destructive" onClick={() => confirm && doCancel(confirm)}>Cancel session</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

/** Shared toggle / delete / add behaviour for roadmap steps and milestones. */
function useItems(table: Table, uid: string, setItems: Dispatch<SetStateAction<Item[]>>) {
  const { toast } = useToast()
  const { pending, run } = usePending()
  const fail = (what: string) => toast({ title: `Could not ${what}`, description: 'Please try again.', variant: 'destructive' })

  const toggle = (it: Item) =>
    run('t:' + it.id, async () => {
      const set = (done: boolean) => (l: Item[]) => l.map((x) => (x.id === it.id ? { ...x, done } : x))
      const ok = await optimistic(setItems, set(!it.done), set(it.done), async () => ({ error: await toggleDone(supabase!, table, it.id, !it.done) }))
      if (!ok) fail('update that item')
    })

  const remove = (it: Item) =>
    run('d:' + it.id, async () => {
      const ok = await optimistic(
        setItems,
        (l) => l.filter((x) => x.id !== it.id),
        (l) => (l.some((x) => x.id === it.id) ? l : [...l, it]),
        async () => ({ error: await deleteItem(supabase!, table, it.id) }),
      )
      if (!ok) fail('delete that item')
    })

  const add = (title: string, due_on: string | null) =>
    run('add', async () => {
      const r = await addItem(supabase!, table, uid, { title, due_on })
      if (r.error || !r.data) return fail('add that item'), false
      setItems((l) => [...l, r.data!])
      return true
    })

  return { pending, run, toggle, remove, add, fail }
}

function AddForm({ label, onAdd, busy }: { label: string; onAdd: (title: string, due: string | null) => Promise<boolean | undefined>; busy: boolean }) {
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [err, setErr] = useState('')
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return setErr('Please enter a title.')
    if (t.length > MAX_TITLE) return setErr(`Keep it under ${MAX_TITLE} characters.`)
    setErr('')
    if (await onAdd(t, due || null)) {
      setTitle('')
      setDue('')
    }
  }
  return (
    <form onSubmit={submit} className="mt-4 space-y-2" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={label} maxLength={MAX_TITLE} aria-label={label} aria-invalid={!!err} />
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date (optional)" className="sm:w-44" />
        <Button type="submit" variant="accent" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Plus />}Add
        </Button>
      </div>
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
    </form>
  )
}

const DueLabel = ({ due }: { due: string | null }) =>
  due ? <span className="text-xs text-muted-foreground">Due {formatIst(`${due}T00:00:00+05:30`).split(' · ')[0]}</span> : null

function RoadmapCard({ uid, items, setItems }: { uid: string; items: Item[]; setItems: Dispatch<SetStateAction<Item[]>> }) {
  const { pending, run, toggle, remove, add, fail } = useItems('roadmap_items', uid, setItems)
  const [path, setPath] = useState(CAREER_PATHS[0])
  const pct = progress(items)

  const generate = () =>
    run('gen', async () => {
      const r = await insertMany(supabase!, 'roadmap_items', uid, starterRoadmap(path, new Date()))
      if (r.error || !r.data) return fail('generate your roadmap')
      setItems((l) => [...l, ...r.data!])
    })

  return (
    <Card title="Growth roadmap">
      {items.length === 0 ? (
        <div className="space-y-3">
          <Empty>No steps yet. Generate a starter plan for your career path, or add your own below.</Empty>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={path} onValueChange={setPath}>
              <SelectTrigger className="sm:w-64" aria-label="Career path"><SelectValue /></SelectTrigger>
              <SelectContent>{CAREER_PATHS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="accent" onClick={generate} disabled={pending.has('gen')}>
              {pending.has('gen') && <Loader2 className="animate-spin" />}Generate starter roadmap
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Progress</span><span className="font-semibold">{pct}%</span></div>
            <div className="h-2 rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-2 rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <ul className="space-y-2">
            {sortByDue(items).map((it) => (
              <li key={it.id} className="flex items-start gap-3 rounded-lg border p-3">
                <button onClick={() => toggle(it)} disabled={pending.has('t:' + it.id)} aria-label={it.done ? `Mark "${it.title}" not done` : `Mark "${it.title}" done`} className="mt-0.5 text-accent disabled:opacity-50">
                  {it.done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn('font-medium break-words', it.done && 'line-through text-muted-foreground')}>{it.title}</p>
                  {it.detail && <p className="text-sm text-muted-foreground">{it.detail}</p>}
                  <DueLabel due={it.due_on} />
                </div>
                <button onClick={() => remove(it)} disabled={pending.has('d:' + it.id)} aria-label={`Delete "${it.title}"`} className="text-muted-foreground hover:text-destructive disabled:opacity-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <AddForm label="Add step" onAdd={add} busy={pending.has('add')} />
    </Card>
  )
}

function MilestonesCard({ uid, items, setItems }: { uid: string; items: Item[]; setItems: Dispatch<SetStateAction<Item[]>> }) {
  const { pending, toggle, remove, add } = useItems('milestones', uid, setItems)
  const today = todayLocal()
  return (
    <Card title="Interview-prep milestones">
      {items.length === 0 ? (
        <Empty>No milestones yet. Add your first interview-prep goal below.</Empty>
      ) : (
        <ol className="relative border-l-2 border-border ml-2 space-y-4">
          {sortByDue(items).map((it) => (
            <li key={it.id} className="ml-5 flex items-start gap-3">
              <span className={cn('absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-card', it.done ? 'bg-accent' : 'bg-muted-foreground/40')} />
              <button onClick={() => toggle(it)} disabled={pending.has('t:' + it.id)} aria-label={it.done ? `Mark "${it.title}" not done` : `Mark "${it.title}" done`} className="mt-0.5 text-accent disabled:opacity-50">
                {it.done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </button>
              <div className="flex-1 min-w-0 space-y-1">
                <p className={cn('font-medium break-words', it.done && 'line-through text-muted-foreground')}>{it.title}</p>
                <div className="flex items-center gap-2">
                  <DueLabel due={it.due_on} />
                  {isOverdue(it, today) && <Badge className="bg-destructive text-destructive-foreground">Overdue</Badge>}
                </div>
              </div>
              <button onClick={() => remove(it)} disabled={pending.has('d:' + it.id)} aria-label={`Delete "${it.title}"`} className="text-muted-foreground hover:text-destructive disabled:opacity-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ol>
      )}
      <AddForm label="Add milestone" onAdd={add} busy={pending.has('add')} />
    </Card>
  )
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [roadmap, setRoadmap] = useState<Item[]>([])
  const [miles, setMiles] = useState<Item[]>([])
  const uid = user?.id

  useEffect(() => {
    if (!supabase || !uid) return
    let live = true
    setState('loading')
    Promise.all([fetchSessions(supabase, uid), fetchItems(supabase, 'roadmap_items', uid), fetchItems(supabase, 'milestones', uid)]).then(([s, r, m]) => {
      if (!live) return
      if (s.error || r.error || m.error) return setState('error')
      setSessions(s.data ?? [])
      setRoadmap(r.data ?? [])
      setMiles(m.data ?? [])
      setState('ready')
    })
    return () => {
      live = false
    }
  }, [uid, attempt])

  const name = profile?.full_name || user?.email || 'there'

  return (
    <div className="min-h-screen bg-background">
      <Navbar solid />
      <main className="container-main section-padding pt-28 pb-16">
        <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">Welcome back, {name}</h1>
        <p className="text-muted-foreground mt-1 mb-8">Your sessions, roadmap and interview prep in one place.</p>
        {!supabase ? (
          <ConnectSupabase />
        ) : state === 'loading' ? (
          <Skeleton />
        ) : state === 'error' || !uid ? (
          <div className="rounded-xl border bg-card p-6 space-y-3" role="alert">
            <p className="text-foreground font-medium">We couldn't load your dashboard.</p>
            <Button variant="accent" onClick={() => setAttempt((a) => a + 1)}>Retry</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <SessionsCard sessions={sessions} setSessions={setSessions} />
            <div className="grid gap-6 lg:grid-cols-2 items-start">
              <RoadmapCard uid={uid} items={roadmap} setItems={setRoadmap} />
              <MilestonesCard uid={uid} items={miles} setItems={setMiles} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
