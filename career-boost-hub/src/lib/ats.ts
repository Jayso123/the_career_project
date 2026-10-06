const STOP = new Set('a an the and or of to in for with on at by from as is are be we you our your will can need needs looking skilled experience required strong good ability work team etc'.split(' '))

export type AtsResult = {
  score: number; matched: string[]; missing: string[]
  sections: Record<'contact' | 'summary' | 'experience' | 'education' | 'skills', boolean>
  warnings: string[]
}

const tokens = (t: string) => (t.toLowerCase().match(/[a-z][a-z+#.]{1,}/g) ?? []).map(w => w.replace(/\.+$/, ''))

// ponytail: single-word keywords by frequency; phrase/synonym matching if scores feel too literal
export function scoreResume(resume: string, jd: string): AtsResult {
  const text = resume.trim()
  const have = new Set(tokens(text))
  const freq = new Map<string, number>()
  for (const w of tokens(jd)) if ((w.length > 2 || /[+#]/.test(w)) && !STOP.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1)
  const kws = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([w]) => w)
  const matched = kws.filter(k => have.has(k))
  const missing = kws.filter(k => !have.has(k))

  const sections = {
    contact: /\S+@\S+\.\S+/.test(text) && /\+?\d[\d\s-]{8,}/.test(text),
    summary: /\b(summary|objective|profile)\b/i.test(text),
    experience: /\b(experience|employment|internship)\b/i.test(text),
    education: /\b(education|b\.?tech|bachelor|master|degree)\b/i.test(text),
    skills: /\bskills?\b/i.test(text),
  }
  const warnings: string[] = []
  if (!sections.contact) warnings.push('Add a contact block with email and phone.')
  for (const [k, ok] of Object.entries(sections)) if (!ok && k !== 'contact') warnings.push(`Add a clear "${k}" section heading.`)
  const words = text ? text.split(/\s+/).length : 0
  if (words > 0 && words < 150) warnings.push('Resume looks very short.')
  if (words > 1200) warnings.push('Resume is long; aim for 1-2 pages.')

  if (!text) return { score: 0, matched: [], missing: kws, sections, warnings: ['Resume text is empty.'] }
  const secScore = Object.values(sections).filter(Boolean).length / 5
  // no usable JD keywords: score from sections only
  const score = Math.round((kws.length ? (matched.length / kws.length) * 0.6 + secScore * 0.4 : secScore) * 100)
  return { score, matched, missing, sections, warnings }
}
