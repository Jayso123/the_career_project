export type ResumeData = {
  template: 'classic' | 'modern'
  personal: { name: string; email: string; phone: string; location: string; links: string[] }
  summary: string
  experience: { id: string; role: string; company: string; from: string; to: string; bullets: string[] }[]
  education: { id: string; degree: string; school: string; year: string }[]
  skills: string[]
  projects: { id: string; name: string; detail: string }[]
}

export const LIMITS = { short: 120, summary: 1000, bullet: 300, bullets: 8, jobs: 10, edu: 6, skills: 30, projects: 8, links: 5, detail: 400, skill: 40, link: 200 } as const

export const newId = () => crypto.randomUUID()

export const emptyResume = (): ResumeData => ({
  template: 'classic',
  personal: { name: '', email: '', phone: '', location: '', links: [] },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
})

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const rec = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})
const list = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : [])
const strs = (v: unknown, max: number, len: number) => list(v, max).map((s) => str(s, len)).filter(Boolean)
const id = (v: unknown) => (typeof v === 'string' && v.length > 0 && v.length <= 64 ? v : newId())
// Rows must be objects; non-object entries are dropped.
const rows = (v: unknown, max: number) => list(v, max).filter((r) => r && typeof r === 'object' && !Array.isArray(r)).map(rec)

/** Validate/coerce anything (localStorage, DB) into a safe ResumeData. Never throws. */
export function normalizeResume(input: unknown): ResumeData {
  const o = rec(input)
  const p = rec(o.personal)
  const S = LIMITS.short
  return {
    template: o.template === 'modern' ? 'modern' : 'classic',
    personal: {
      name: str(p.name, S), email: str(p.email, S), phone: str(p.phone, 30), location: str(p.location, S),
      links: strs(p.links, LIMITS.links, LIMITS.link),
    },
    summary: str(o.summary, LIMITS.summary),
    experience: rows(o.experience, LIMITS.jobs).map((e) => ({
      id: id(e.id), role: str(e.role, S), company: str(e.company, S), from: str(e.from, 30), to: str(e.to, 30),
      bullets: strs(e.bullets, LIMITS.bullets, LIMITS.bullet),
    })),
    education: rows(o.education, LIMITS.edu).map((e) => ({ id: id(e.id), degree: str(e.degree, S), school: str(e.school, S), year: str(e.year, 30) })),
    skills: strs(o.skills, LIMITS.skills, LIMITS.skill),
    projects: rows(o.projects, LIMITS.projects).map((e) => ({ id: id(e.id), name: str(e.name, S), detail: str(e.detail, LIMITS.detail) })),
  }
}

/** https-only link; bare domains get https://. Anything else (javascript:, data:, //host, mailto:, http:) -> null. */
export function safeUrl(s: string): string | null {
  const t = s.trim()
  if (!t || t.startsWith('//') || /\s/.test(t)) return null
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(t)
  if (hasScheme && !/^https:\/\//i.test(t)) return null
  try {
    const u = new URL(hasScheme ? t : `https://${t}`)
    if (u.protocol !== 'https:' || !u.hostname.includes('.')) return null
    return u.href
  } catch {
    return null
  }
}
