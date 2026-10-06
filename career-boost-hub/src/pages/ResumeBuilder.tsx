import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Download, Plus, RotateCcw, Trash2 } from 'lucide-react'
import Navbar from '../components/clone/Navbar'
import ResumePreview from '../components/ResumePreview'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { toast } from '../components/ui/use-toast'
import { useAuth } from '../context/AuthContext'
import { LIMITS, emptyResume, newId, type ResumeData } from '../lib/resumeModel'
import { createSaver, loadLocal, loadRemote, saveLocal, type SaveStatus } from '../lib/resumeStorage'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import '../styles/print.css'

type Exp = ResumeData['experience'][number]
const S = LIMITS.short
const LOCAL = 'Saved locally'
const ACCOUNT = 'Saved to your account'

function Field({ label, id, ...p }: { label: string; id: string } & React.ComponentProps<'input'>) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
      <Input id={id} {...p} />
    </div>
  )
}

function Section({ id, title, open, toggle, children }: { id: string; title: string; open: boolean; toggle: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card shadow-sm">
      <h2>
        <button type="button" id={`${id}-h`} aria-expanded={open} aria-controls={`${id}-p`} onClick={toggle} className="flex w-full items-center justify-between px-4 py-3 text-left font-heading font-semibold text-foreground">
          {title}
          <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} aria-hidden />
        </button>
      </h2>
      <div id={`${id}-p`} role="region" aria-labelledby={`${id}-h`} hidden={!open} className="space-y-4 border-t px-4 py-4">{children}</div>
    </section>
  )
}

const RowCard = ({ children, onRemove, label }: { children: React.ReactNode; onRemove: () => void; label: string }) => (
  <div className="space-y-3 rounded-lg border p-3">
    {children}
    <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label={`Remove ${label}`}><Trash2 aria-hidden />Remove</Button>
  </div>
)

export default function ResumeBuilder() {
  const { user } = useAuth()
  const uid = user?.id
  const [data, setData] = useState<ResumeData>(() => loadLocal() ?? emptyResume())
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [open, setOpen] = useState<Set<string>>(new Set(['personal']))
  const [rev, setRev] = useState(0) // remounts the uncontrolled skills input after reset / remote load
  const [confirm, setConfirm] = useState(false)
  const saver = useRef<ReturnType<typeof createSaver> | null>(null)
  const skip = useRef(true) // don't echo a freshly loaded value back to the DB
  const latest = useRef(data)
  latest.current = data

  // Signed in: load the DB row (falls back to the local draft), then enable auto-save.
  // A failed read never enables saving, so a transient error can't overwrite the stored row.
  useEffect(() => {
    saver.current = null
    setStatus('idle')
    if (!uid || !supabase) return
    let live = true
    const db = supabase
    void loadRemote(db, uid).then((remote) => {
      if (!live || remote === undefined) return
      if (remote) {
        skip.current = true
        setData(remote)
        setRev((r) => r + 1)
      }
      saver.current = createSaver(db, uid, {
        onStatus: (s) => live && setStatus(s),
        onFailure: () => toast({ title: "Couldn't save your resume to your account", description: 'Your changes are kept in this browser.', variant: 'destructive' }),
      })
      if (!remote) saver.current.save(latest.current) // no row yet: persist the local draft
    })
    return () => {
      live = false
      saver.current?.cancel()
      saver.current = null
    }
  }, [uid])

  useEffect(() => {
    saveLocal(data)
    if (skip.current) {
      skip.current = false
      return
    }
    saver.current?.save(data)
  }, [data])

  const set = (f: (d: ResumeData) => ResumeData) => setData(f)
  const toggle = (k: string) => setOpen((s) => { const n = new Set(s); if (!n.delete(k)) n.add(k); return n })
  const upExp = (id: string, f: (e: Exp) => Exp) => set((d) => ({ ...d, experience: d.experience.map((e) => (e.id === id ? f(e) : e)) }))
  const upList = <K extends 'education' | 'projects'>(k: K, id: string, patch: Partial<ResumeData[K][number]>) =>
    set((d) => ({ ...d, [k]: (d[k] as { id: string }[]).map((e) => (e.id === id ? { ...e, ...patch } : e)) }))
  const del = (k: 'experience' | 'education' | 'projects', id: string) => set((d) => ({ ...d, [k]: (d[k] as { id: string }[]).filter((e) => e.id !== id) }))
  const personal = (k: keyof ResumeData['personal'], v: string) => set((d) => ({ ...d, personal: { ...d.personal, [k]: v } }))
  const setLinks = (f: (l: string[]) => string[]) => set((d) => ({ ...d, personal: { ...d.personal, links: f(d.personal.links) } }))

  const statusText =
    status === 'saving' ? 'Saving…'
    : status === 'error' ? "Couldn't save — your changes are kept in this browser"
    : status === 'saved' && uid ? ACCOUNT
    : LOCAL
  const p = data.personal
  const preview = useMemo(() => <ResumePreview data={data} />, [data])
  const sec = (id: string, title: string, body: React.ReactNode) => <Section id={id} title={title} open={open.has(id)} toggle={() => toggle(id)}>{body}</Section>

  return (
    <div className="print-root min-h-screen bg-background">
      <Navbar solid />
      <main className="container-main section-padding pt-28 pb-16">
        <div className="no-print">
          <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">Resume Builder</h1>
          <p className="text-muted-foreground mt-1 mb-6">Build a clean, ATS-friendly resume and save it as a PDF.</p>
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
            <div role="group" aria-label="Template" className="inline-flex rounded-lg border p-0.5">
              {(['classic', 'modern'] as const).map((t) => (
                <button key={t} type="button" aria-pressed={data.template === t} onClick={() => set((d) => ({ ...d, template: t }))}
                  className={cn('rounded-md px-3 py-1.5 text-sm font-medium capitalize', data.template === t ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/10')}>
                  {t}
                </button>
              ))}
            </div>
            <Button type="button" variant="accent" onClick={() => window.print()}><Download aria-hidden />Download PDF</Button>
            <Button type="button" variant="outline" onClick={() => setConfirm(true)}><RotateCcw aria-hidden />Start over</Button>
            <p role="status" aria-live="polite" className={cn('ml-auto text-sm', status === 'error' ? 'text-destructive font-medium' : 'text-muted-foreground')}>{statusText}</p>
          </div>
        </div>
        <div className="print-grid grid gap-6 lg:grid-cols-2 items-start">
          <div className="no-print space-y-3">
            {sec('personal', 'Personal', <>
              <Field label="Full name" id="rb-name" maxLength={S} value={p.name} onChange={(e) => personal('name', e.target.value)} autoComplete="name" />
              <Field label="Email" id="rb-email" type="email" maxLength={S} value={p.email} onChange={(e) => personal('email', e.target.value)} autoComplete="email" />
              <Field label="Phone" id="rb-phone" type="tel" maxLength={30} value={p.phone} onChange={(e) => personal('phone', e.target.value)} autoComplete="tel" />
              <Field label="Location" id="rb-loc" maxLength={S} value={p.location} onChange={(e) => personal('location', e.target.value)} />
              {p.links.map((l, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Field label={`Link ${i + 1}`} id={`rb-link-${i}`} maxLength={LIMITS.link} value={l} placeholder="linkedin.com/in/you" onChange={(e) => setLinks((ls) => ls.map((x, j) => (j === i ? e.target.value : x)))} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Remove link ${i + 1}`} onClick={() => setLinks((ls) => ls.filter((_, j) => j !== i))}><Trash2 aria-hidden /></Button>
                </div>
              ))}
              {p.links.length < LIMITS.links && <Button type="button" variant="outline" size="sm" onClick={() => setLinks((ls) => [...ls, ''])}><Plus aria-hidden />Add link</Button>}
            </>)}

            {sec('summary', 'Summary', <>
              <label htmlFor="rb-summary" className="text-sm font-medium text-foreground">Professional summary</label>
              <Textarea id="rb-summary" rows={4} maxLength={LIMITS.summary} value={data.summary} onChange={(e) => set((d) => ({ ...d, summary: e.target.value }))} />
              <p className="text-xs text-muted-foreground">{data.summary.length}/{LIMITS.summary}</p>
            </>)}

            {sec('experience', 'Experience', <>
              {data.experience.map((e, n) => (
                <RowCard key={e.id} label={`experience ${n + 1}`} onRemove={() => del('experience', e.id)}>
                  <Field label="Role" id={`rb-role-${e.id}`} maxLength={S} value={e.role} onChange={(x) => upExp(e.id, (v) => ({ ...v, role: x.target.value }))} />
                  <Field label="Company" id={`rb-co-${e.id}`} maxLength={S} value={e.company} onChange={(x) => upExp(e.id, (v) => ({ ...v, company: x.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="From" id={`rb-from-${e.id}`} maxLength={30} placeholder="Jan 2023" value={e.from} onChange={(x) => upExp(e.id, (v) => ({ ...v, from: x.target.value }))} />
                    <Field label="To" id={`rb-to-${e.id}`} maxLength={30} placeholder="Present" value={e.to} onChange={(x) => upExp(e.id, (v) => ({ ...v, to: x.target.value }))} />
                  </div>
                  {e.bullets.map((b, i) => (
                    <div key={i} className="flex items-end gap-2">
                      <div className="flex-1">
                        <Field label={`Bullet ${i + 1}`} id={`rb-b-${e.id}-${i}`} maxLength={LIMITS.bullet} value={b} onChange={(x) => upExp(e.id, (v) => ({ ...v, bullets: v.bullets.map((y, j) => (j === i ? x.target.value : y)) }))} />
                      </div>
                      <Button type="button" variant="ghost" size="icon" aria-label={`Remove bullet ${i + 1}`} onClick={() => upExp(e.id, (v) => ({ ...v, bullets: v.bullets.filter((_, j) => j !== i) }))}><Trash2 aria-hidden /></Button>
                    </div>
                  ))}
                  {e.bullets.length < LIMITS.bullets && <Button type="button" variant="outline" size="sm" onClick={() => upExp(e.id, (v) => ({ ...v, bullets: [...v.bullets, ''] }))}><Plus aria-hidden />Add bullet</Button>}
                </RowCard>
              ))}
              {data.experience.length < LIMITS.jobs && <Button type="button" variant="outline" onClick={() => set((d) => ({ ...d, experience: [...d.experience, { id: newId(), role: '', company: '', from: '', to: '', bullets: [] }] }))}><Plus aria-hidden />Add experience</Button>}
            </>)}

            {sec('education', 'Education', <>
              {data.education.map((e, n) => (
                <RowCard key={e.id} label={`education ${n + 1}`} onRemove={() => del('education', e.id)}>
                  <Field label="Degree" id={`rb-deg-${e.id}`} maxLength={S} value={e.degree} onChange={(x) => upList('education', e.id, { degree: x.target.value })} />
                  <Field label="School" id={`rb-sch-${e.id}`} maxLength={S} value={e.school} onChange={(x) => upList('education', e.id, { school: x.target.value })} />
                  <Field label="Year" id={`rb-yr-${e.id}`} maxLength={30} value={e.year} onChange={(x) => upList('education', e.id, { year: x.target.value })} />
                </RowCard>
              ))}
              {data.education.length < LIMITS.edu && <Button type="button" variant="outline" onClick={() => set((d) => ({ ...d, education: [...d.education, { id: newId(), degree: '', school: '', year: '' }] }))}><Plus aria-hidden />Add education</Button>}
            </>)}

            {sec('skills', 'Skills', <>
              <label htmlFor="rb-skills" className="text-sm font-medium text-foreground">Skills (comma separated, up to {LIMITS.skills})</label>
              <Input key={rev} id="rb-skills" defaultValue={data.skills.join(', ')} placeholder="React, SQL, Communication"
                onChange={(e) => { const skills = e.target.value.split(',').map((s) => s.trim().slice(0, LIMITS.skill)).filter(Boolean).slice(0, LIMITS.skills); set((d) => ({ ...d, skills })) }} />
              {data.skills.length > 0 && <ul className="flex flex-wrap gap-2" aria-label="Skills list">{data.skills.map((s, i) => <li key={i} className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent break-all">{s}</li>)}</ul>}
            </>)}

            {sec('projects', 'Projects', <>
              {data.projects.map((e, n) => (
                <RowCard key={e.id} label={`project ${n + 1}`} onRemove={() => del('projects', e.id)}>
                  <Field label="Project name" id={`rb-pn-${e.id}`} maxLength={S} value={e.name} onChange={(x) => upList('projects', e.id, { name: x.target.value })} />
                  <label htmlFor={`rb-pd-${e.id}`} className="text-sm font-medium text-foreground">Details</label>
                  <Textarea id={`rb-pd-${e.id}`} rows={2} maxLength={LIMITS.detail} value={e.detail} onChange={(x) => upList('projects', e.id, { detail: x.target.value })} />
                </RowCard>
              ))}
              {data.projects.length < LIMITS.projects && <Button type="button" variant="outline" onClick={() => set((d) => ({ ...d, projects: [...d.projects, { id: newId(), name: '', detail: '' }] }))}><Plus aria-hidden />Add project</Button>}
            </>)}
          </div>
          <div className="lg:sticky lg:top-24">{preview}</div>
        </div>
      </main>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Start over?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This clears everything in the builder, including your saved copy.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirm(false)}>Keep my resume</Button>
            <Button variant="destructive" onClick={() => { set(() => emptyResume()); setRev((r) => r + 1); setConfirm(false) }}>Start over</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
