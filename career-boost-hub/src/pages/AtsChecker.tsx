import { useRef, useState } from 'react'
import { Check, Loader2, ShieldCheck, X } from 'lucide-react'
import Navbar from '../components/clone/Navbar'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { useToast } from '../components/ui/use-toast'
import { scoreResume, type AtsResult } from '../lib/ats'
import { readResumeFile, validateResumeFile } from '../lib/readResumeFile'
import { cn } from '../lib/utils'

const SECTION_LABELS: Record<keyof AtsResult['sections'], string> = {
  contact: 'Contact', summary: 'Summary', experience: 'Experience', education: 'Education', skills: 'Skills',
}

function Gauge({ score, label }: { score: number; label: string }) {
  const r = 52
  const c = 2 * Math.PI * r
  const tone = score >= 75 ? 'text-accent' : score >= 50 ? 'text-amber-500' : 'text-destructive'
  return (
    <svg viewBox="0 0 120 120" className={cn('w-36 h-36', tone)} role="img" aria-label={`${label} ${score} out of 100`}>
      <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
      <circle
        cx="60" cy="60" r={r} fill="none" strokeWidth="10" strokeLinecap="round" stroke="currentColor"
        strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} transform="rotate(-90 60 60)"
      />
      <text x="60" y="60" textAnchor="middle" dominantBaseline="central" className="fill-foreground font-heading text-3xl font-bold">{score}</text>
    </svg>
  )
}

const Chip = ({ children, tone }: { children: React.ReactNode; tone: 'accent' | 'destructive' }) => (
  <li className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold break-all', tone === 'accent' ? 'bg-accent/10 text-accent' : 'border border-destructive/40 text-destructive')}>
    {children}
  </li>
)

function Result({ r, stale }: { r: AtsResult; stale: boolean }) {
  const shown = r.hasKeywords ? r.score : r.formatScore
  const label = r.hasKeywords ? 'ATS score' : 'Formatting score'
  return (
    <div className={cn('space-y-6 transition-opacity', stale && 'opacity-50')}>
      <p className="sr-only" role="status" aria-live="polite">{stale ? '' : `${label} ${shown} out of 100`}</p>
      {stale && <p className="text-sm font-medium text-amber-600">Inputs changed - press Analyze again</p>}
      <div className="flex flex-col items-center gap-1">
        <Gauge score={shown} label={label} />
        <p className="text-sm text-muted-foreground">{r.hasKeywords ? 'Keyword match + section coverage' : 'Formatting score only. Add a job description for keyword matching.'}</p>
      </div>
      {r.hasKeywords && (
        <>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Matched keywords ({r.matched.length})</h3>
            {r.matched.length ? <ul className="flex flex-wrap gap-2">{r.matched.map((k) => <Chip key={k} tone="accent">{k}</Chip>)}</ul> : <p className="text-sm text-muted-foreground">None found.</p>}
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Missing keywords ({r.missing.length})</h3>
            {r.missing.length ? <ul className="flex flex-wrap gap-2">{r.missing.map((k) => <Chip key={k} tone="destructive">{k}</Chip>)}</ul> : <p className="text-sm text-muted-foreground">Nothing missing.</p>}
          </div>
        </>
      )}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Sections</h3>
        <ul className="grid grid-cols-2 gap-2">
          {(Object.keys(SECTION_LABELS) as (keyof AtsResult['sections'])[]).map((k) => (
            <li key={k} className="flex items-center gap-2 text-sm">
              {r.sections[k] ? <Check className="w-4 h-4 text-accent" aria-hidden /> : <X className="w-4 h-4 text-destructive" aria-hidden />}
              <span>{SECTION_LABELS[k]}</span>
              <span className="sr-only">{r.sections[k] ? 'found' : 'missing'}</span>
            </li>
          ))}
        </ul>
      </div>
      {r.warnings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Warnings</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">{r.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}
    </div>
  )
}

export default function AtsChecker() {
  const { toast } = useToast()
  const [resume, setResume] = useState('')
  const [jd, setJd] = useState('')
  const [parsing, setParsing] = useState(false)
  const [fileErr, setFileErr] = useState('')
  const [result, setResult] = useState<{ r: AtsResult; resume: string; jd: string } | null>(null)
  const [notice, setNotice] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setFileErr('')
    setNotice('')
    const bad = validateResumeFile(file)
    if (bad) {
      setFileErr(bad)
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setParsing(true)
    try {
      const { text, truncated } = await readResumeFile(file)
      if (!text) throw new Error('empty')
      setResume(text)
      if (truncated) setNotice('Only the first 20 pages were read')
    } catch {
      toast({ title: "Couldn't read that file; paste the text instead", variant: 'destructive' })
    } finally {
      setParsing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const analyze = () => setResult({ r: scoreResume(resume, jd), resume, jd })

  return (
    <div className="min-h-screen bg-background">
      <Navbar solid />
      <main className="container-main section-padding pt-28 pb-16">
        <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">ATS Resume Checker</h1>
        <p className="text-muted-foreground mt-1 mb-2">See how an applicant tracking system might read your resume against a job description.</p>
        <p className="flex items-center gap-1.5 text-sm text-accent font-medium mb-8"><ShieldCheck className="w-4 h-4" aria-hidden />Your resume never leaves your browser</p>
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <section className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
            <div className="space-y-2">
              <label htmlFor="ats-file" className="text-sm font-medium text-foreground">Upload resume (.pdf, .docx or .txt, max 5 MB)</label>
              <input
                id="ats-file" ref={fileRef} type="file" accept=".pdf,.docx,.txt" disabled={parsing}
                onChange={(e) => void onFile(e.target.files?.[0])}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground"
              />
              {parsing && <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><Loader2 className="w-4 h-4 animate-spin" />Reading file...</p>}
              {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
              {fileErr && <p role="alert" className="text-sm text-destructive">{fileErr}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="ats-resume" className="text-sm font-medium text-foreground">Paste your resume text</label>
              <Textarea id="ats-resume" rows={10} value={resume} onChange={(e) => setResume(e.target.value)} placeholder="Paste your resume here, or upload a file above" />
            </div>
            <div className="space-y-2">
              <label htmlFor="ats-jd" className="text-sm font-medium text-foreground">Paste the job description</label>
              <Textarea id="ats-jd" rows={8} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Optional, but needed for keyword matching" />
              {!jd.trim() && <p className="text-sm text-muted-foreground">Add a job description to get keyword matching</p>}
            </div>
            <Button variant="accent" onClick={analyze} disabled={parsing || !resume.trim()}>
              {parsing && <Loader2 className="animate-spin" />}Analyze
            </Button>
          </section>
          <section className="rounded-xl border bg-card p-6 shadow-sm" aria-label="ATS results">
            <h2 className="font-display text-xl font-bold text-foreground mb-4">Your result</h2>
            {result ? <Result r={result.r} stale={result.resume !== resume || result.jd !== jd} /> : <p className="text-sm text-muted-foreground">Paste or upload your resume and press Analyze to see your score.</p>}
          </section>
        </div>
      </main>
    </div>
  )
}
