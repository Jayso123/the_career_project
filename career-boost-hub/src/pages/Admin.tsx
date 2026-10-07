import { useCallback, useEffect, useRef, useState, type Dispatch, type FormEvent, type KeyboardEvent, type ReactNode, type SetStateAction } from 'react'
import { Download, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import Navbar from '../components/clone/Navbar'
import ConnectSupabase from '../components/ConnectSupabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { useToast } from '../components/ui/use-toast'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import { createGuard, optimistic } from '../lib/dashboardApi'
import { formatIst } from '../lib/dashboardLogic'
import {
  createMentor, deleteMentor, fetchBookings, fetchLeads, fetchMentors, isFkViolation, setSessionStatus, updateMentor,
} from '../lib/adminApi'
import { filterBookings, filterLeads, safeMailto, safeTel, validateMentor, type BookingRow, type Lead, type Mentor, type MentorInput, type Status } from '../lib/adminLogic'
import { toCsv } from '../lib/csv'

const TABS = ['Bookings', 'Leads', 'Mentors'] as const
type Tab = (typeof TABS)[number]
type Client = NonNullable<typeof supabase>

const STATUS_STYLE: Record<Status, string> = {
  booked: 'bg-accent/10 text-accent',
  completed: 'bg-secondary text-secondary-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
}
const Badge = ({ className, children }: { className?: string; children: ReactNode }) => (
  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', className)}>{children}</span>
)
const Empty = ({ children }: { children: ReactNode }) => <p className="text-sm text-muted-foreground py-6 text-center">{children}</p>

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

/** Fetches on mount, so admin data is only requested while this page's active tab is shown. */
function useLoad<T>(fetcher: (db: Client) => Promise<{ data: T[] | null; error: unknown }>) {
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading')
  const [rows, setRows] = useState<T[]>([])
  const [attempt, setAttempt] = useState(0)
  const f = useRef(fetcher)
  useEffect(() => {
    if (!supabase) return
    let live = true
    setState('loading')
    f.current(supabase).then((r) => {
      if (!live) return
      if (r.error || !r.data) return setState('error')
      setRows(r.data)
      setState('ready')
    })
    return () => {
      live = false
    }
  }, [attempt])
  return { state, rows, setRows, retry: () => setAttempt((a) => a + 1) }
}

function Gate({ state, retry, label, children }: { state: 'loading' | 'error' | 'ready'; retry: () => void; label: string; children: ReactNode }) {
  if (state === 'loading')
    return (
      <div className="space-y-3 animate-pulse" aria-busy="true" aria-label={`Loading ${label}`}>
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-muted" />)}
      </div>
    )
  if (state === 'error')
    return (
      <div className="rounded-xl border bg-card p-6 space-y-3" role="alert">
        <p className="font-medium text-foreground">We couldn't load {label}.</p>
        <Button variant="accent" onClick={retry}>Retry</Button>
      </div>
    )
  return <>{children}</>
}

function ConfirmDialog({ open, title, body, action, onConfirm, onClose }: { open: boolean; title: string; body: string; action: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground break-words">{body}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Keep</Button>
          <Button variant="destructive" onClick={onConfirm}>{action}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Truncated text that expands on click; the full text is also in the title. */
function Expandable({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  if (!text) return <span className="text-muted-foreground">-</span>
  return (
    <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} title={text} className={cn('text-left text-sm break-words max-w-xs', !open && 'line-clamp-2')}>
      {text}
    </button>
  )
}

const Th = ({ children }: { children: ReactNode }) => <th scope="col" className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">{children}</th>
const Td = ({ children, className }: { children: ReactNode; className?: string }) => <td className={cn('px-3 py-3 align-top', className)}>{children}</td>
const Table = ({ children, label }: { children: ReactNode; label: string }) => (
  <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm" aria-label={label}>{children}</table></div>
)

function BookingsTab() {
  const load = useLoad<BookingRow>(fetchBookings)
  const { rows, setRows } = load
  const { toast } = useToast()
  const { pending, run } = usePending()
  const [status, setStatus] = useState<Status | 'all'>('all')
  const [q, setQ] = useState('')
  const [confirm, setConfirm] = useState<BookingRow | null>(null)

  const change = (r: BookingRow, to: Status) =>
    run('b:' + r.id, async () => {
      const set = (st: Status) => (l: BookingRow[]) => l.map((x) => (x.id === r.id ? { ...x, status: st } : x))
      const ok = await optimistic(setRows, set(to), set(r.status), async () => ({ error: await setSessionStatus(supabase!, r.id, to) }))
      if (!ok) toast({ title: `Could not mark the booking ${to}`, description: 'Please try again.', variant: 'destructive' })
    })

  const shown = filterBookings(rows, status, q)
  return (
    <Gate state={load.state} retry={load.retry} label="bookings">
      <div className="flex flex-col gap-2 sm:flex-row mb-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student, mentor or requirements" aria-label="Search bookings" className="sm:max-w-sm" />
        <Select value={status} onValueChange={(v) => setStatus(v as Status | 'all')}>
          <SelectTrigger className="sm:w-44" aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['all', 'booked', 'completed', 'cancelled'].map((s) => <SelectItem key={s} value={s}>{s === 'all' ? 'All statuses' : s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {shown.length === 0 ? (
        <Empty>{rows.length ? 'No bookings match your filters.' : 'No bookings yet.'}</Empty>
      ) : (
        <Table label="Bookings">
          <thead className="bg-muted/50"><tr><Th>When (IST)</Th><Th>Student</Th><Th>Mentor</Th><Th>Plan</Th><Th>Status</Th><Th>Requirements</Th><Th>Payment</Th><Th>Actions</Th></tr></thead>
          <tbody className="divide-y">
            {shown.map((r) => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap">{formatIst(r.starts_at)}</Td>
                <Td>{r.student?.full_name || '-'}</Td>
                <Td>{r.mentor?.name ?? '-'}</Td>
                <Td>{r.plan}</Td>
                <Td><Badge className={STATUS_STYLE[r.status]}>{r.status}</Badge></Td>
                <Td><Expandable text={r.requirements} /></Td>
                <Td className="whitespace-nowrap">{r.payment ? `${r.payment.reference} (${r.payment.mode})` : '-'}</Td>
                <Td>
                  {r.status === 'booked' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={pending.has('b:' + r.id)} onClick={() => change(r, 'completed')}>
                        {pending.has('b:' + r.id) && <Loader2 className="animate-spin" />}Mark completed
                      </Button>
                      <Button size="sm" variant="outline" disabled={pending.has('b:' + r.id)} onClick={() => setConfirm(r)}>Cancel</Button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <ConfirmDialog
        open={!!confirm}
        title="Cancel this booking?"
        body={confirm ? `${confirm.student?.full_name || 'Student'} with ${confirm.mentor?.name ?? 'mentor'} on ${formatIst(confirm.starts_at)}. The slot will be released.` : ''}
        action="Cancel booking"
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          const r = confirm
          setConfirm(null)
          if (r) void change(r, 'cancelled')
        }}
      />
    </Gate>
  )
}

// Note: cells starting with = + - @ get a leading apostrophe on purpose (formula-injection guard), so +91 phones export as '+91...
function downloadCsv(leads: Lead[]) {
  const csv = toCsv(leads, [
    { key: 'name', header: 'Name' }, { key: 'email', header: 'Email' }, { key: 'phone', header: 'Phone' },
    { key: 'goals', header: 'Goals' }, { key: 'created_at', header: 'Created at' },
  ])
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'leads.csv' })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function LeadsTab() {
  const load = useLoad<Lead>(fetchLeads)
  const [q, setQ] = useState('')
  const shown = filterLeads(load.rows, q)
  return (
    <Gate state={load.state} retry={load.retry} label="leads">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between mb-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search leads" aria-label="Search leads" className="sm:max-w-sm" />
        <Button variant="outline" onClick={() => downloadCsv(shown)} disabled={!shown.length}><Download />Export CSV</Button>
      </div>
      {shown.length === 0 ? (
        <Empty>{load.rows.length ? 'No leads match your search.' : 'No leads yet.'}</Empty>
      ) : (
        <Table label="Leads">
          <thead className="bg-muted/50"><tr><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Goals</Th><Th>Created (IST)</Th></tr></thead>
          <tbody className="divide-y">
            {shown.map((l) => (
              <tr key={l.id}>
                <Td>{l.name}</Td>
                <Td>{safeMailto(l.email) ? <a href={safeMailto(l.email)!} className="text-accent hover:underline break-all">{l.email}</a> : <span className="break-all">{l.email}</span>}</Td>
                <Td>{safeTel(l.phone) ? <a href={safeTel(l.phone)!} className="text-accent hover:underline whitespace-nowrap">{l.phone}</a> : <span className="whitespace-nowrap">{l.phone}</span>}</Td>
                <Td><Expandable text={l.goals} /></Td>
                <Td className="whitespace-nowrap">{formatIst(l.created_at)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Gate>
  )
}

const BLANK: MentorInput = { name: '', title: '', company: '', bio: '', skills: '', rate_inr: '299', photo_url: '' }
const toForm = (m: Mentor): MentorInput => ({ name: m.name, title: m.title, company: m.company, bio: m.bio, skills: m.skills.join(', '), rate_inr: String(m.rate_inr), photo_url: m.photo_url ?? '' })

function MentorForm({ editing, onClose, setRows }: { editing: Mentor | null; onClose: () => void; setRows: Dispatch<SetStateAction<Mentor[]>> }) {
  const { toast } = useToast()
  const { pending, run } = usePending()
  const [form, setForm] = useState<MentorInput>(editing ? toForm(editing) : BLANK)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const props = (k: keyof MentorInput) => ({
    id: `m-${k}`,
    value: form[k],
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value })),
    'aria-invalid': !!errors[k],
    'aria-describedby': errors[k] ? `m-${k}-err` : undefined,
  })
  const field = (k: keyof MentorInput, label: string, node: ReactNode) => (
    <div className="space-y-1">
      <label htmlFor={`m-${k}`} className="text-sm font-medium">{label}</label>
      {node}
      {errors[k] && <p id={`m-${k}-err`} role="alert" className="text-sm text-destructive">{errors[k]}</p>}
    </div>
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = validateMentor(form)
    if (!v.ok) return setErrors(v.errors)
    setErrors({})
    void run('save', async () => {
      const r = editing ? await updateMentor(supabase!, editing.id, v.value) : await createMentor(supabase!, v.value)
      if (r.error || !r.data) {
        const dup = (r.error as { code?: string } | null)?.code === '23505'
        return toast({
          title: dup ? 'A mentor with that name already exists' : `Could not ${editing ? 'update' : 'create'} the mentor`,
          description: dup ? 'Names must be unique.' : 'Please try again.',
          variant: 'destructive',
        })
      }
      const saved = r.data
      setRows((l) => (editing ? l.map((x) => (x.id === saved.id ? saved : x)) : [...l, saved]).sort((a, b) => a.name.localeCompare(b.name)))
      onClose()
    })
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      {field('name', 'Name', <Input {...props('name')} maxLength={100} />)}
      {editing && <p className="text-xs text-muted-foreground -mt-2">Name is used to match the booking modal's mentors; renaming breaks that link.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {field('title', 'Title', <Input {...props('title')} maxLength={100} />)}
        {field('company', 'Company', <Input {...props('company')} maxLength={100} />)}
      </div>
      {field('bio', 'Bio', <Textarea {...props('bio')} maxLength={1000} rows={4} />)}
      {field('skills', 'Skills (comma-separated)', <Input {...props('skills')} />)}
      <div className="grid gap-3 sm:grid-cols-2">
        {field('rate_inr', 'Rate (INR)', <Input {...props('rate_inr')} inputMode="numeric" />)}
        {field('photo_url', 'Photo URL (optional, https)', <Input {...props('photo_url')} type="url" />)}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
        <Button type="submit" variant="accent" disabled={pending.has('save')}>
          {pending.has('save') && <Loader2 className="animate-spin" />}{editing ? 'Save changes' : 'Create mentor'}
        </Button>
      </div>
    </form>
  )
}

function MentorsTab() {
  const load = useLoad<Mentor>(fetchMentors)
  const { toast } = useToast()
  const { pending, run } = usePending()
  const [form, setForm] = useState<{ editing: Mentor | null } | null>(null)
  const [confirm, setConfirm] = useState<Mentor | null>(null)

  const remove = (m: Mentor) =>
    run('d:' + m.id, async () => {
      const err = await deleteMentor(supabase!, m.id)
      if (err) {
        const fk = isFkViolation(err)
        return toast({
          title: fk ? "This mentor has bookings and can't be deleted" : 'Could not delete the mentor',
          description: fk ? 'Existing sessions reference this mentor.' : 'Please try again.',
          variant: 'destructive',
        })
      }
      load.setRows((l) => l.filter((x) => x.id !== m.id))
    })

  return (
    <Gate state={load.state} retry={load.retry} label="mentors">
      <div className="flex justify-end mb-4">
        <Button variant="accent" onClick={() => setForm({ editing: null })}><Plus />Add mentor</Button>
      </div>
      {load.rows.length === 0 ? (
        <Empty>No mentors yet.</Empty>
      ) : (
        <Table label="Mentors">
          <thead className="bg-muted/50"><tr><Th>Name</Th><Th>Title</Th><Th>Company</Th><Th>Skills</Th><Th>Rate</Th><Th>Actions</Th></tr></thead>
          <tbody className="divide-y">
            {load.rows.map((m) => (
              <tr key={m.id}>
                <Td className="font-medium">{m.name}</Td>
                <Td>{m.title}</Td>
                <Td>{m.company}</Td>
                <Td><span className="line-clamp-2 break-words max-w-xs" title={m.skills.join(', ')}>{m.skills.join(', ')}</span></Td>
                <Td className="whitespace-nowrap">₹{m.rate_inr}</Td>
                <Td>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setForm({ editing: m })} aria-label={`Edit ${m.name}`}><Pencil /></Button>
                    <Button size="sm" variant="outline" disabled={pending.has('d:' + m.id)} onClick={() => setConfirm(m)} aria-label={`Delete ${m.name}`}>
                      {pending.has('d:' + m.id) ? <Loader2 className="animate-spin" /> : <Trash2 />}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form?.editing ? 'Edit mentor' : 'Add mentor'}</DialogTitle></DialogHeader>
          {form && <MentorForm editing={form.editing} onClose={() => setForm(null)} setRows={load.setRows} />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!confirm}
        title="Delete this mentor?"
        body={confirm ? `${confirm.name} will be removed permanently. Mentors with bookings can't be deleted.` : ''}
        action="Delete mentor"
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          const m = confirm
          setConfirm(null)
          if (m) void remove(m)
        }}
      />
    </Gate>
  )
}

export default function Admin() {
  const [tab, setTab] = useState<Tab>('Bookings')
  const onKey = (e: KeyboardEvent) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    const next = TABS[(TABS.indexOf(tab) + d + TABS.length) % TABS.length]
    setTab(next)
    document.getElementById(`tab-${next}`)?.focus()
  }
  return (
    <div className="min-h-screen bg-background">
      <Navbar solid />
      <main className="container-main section-padding pt-28 pb-16">
        <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">Admin</h1>
        <p className="text-muted-foreground mt-1 mb-8">Bookings, leads and mentors.</p>
        {!supabase ? (
          <ConnectSupabase />
        ) : (
          <section className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
            <div role="tablist" aria-label="Admin sections" onKeyDown={onKey} className="flex gap-1 border-b mb-6">
              {TABS.map((t) => (
                <button
                  key={t}
                  id={`tab-${t}`}
                  role="tab"
                  type="button"
                  aria-selected={tab === t}
                  aria-controls="admin-panel"
                  tabIndex={tab === t ? 0 : -1}
                  onClick={() => setTab(t)}
                  className={cn('px-4 py-2 text-sm font-semibold -mb-px border-b-2', tab === t ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground')}
                >
                  {t}
                </button>
              ))}
            </div>
            <div role="tabpanel" id="admin-panel" aria-labelledby={`tab-${tab}`} tabIndex={0}>
              {tab === 'Bookings' ? <BookingsTab /> : tab === 'Leads' ? <LeadsTab /> : <MentorsTab />}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
