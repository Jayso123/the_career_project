const STOP = new Set(('a an the and or of to in for with on at by from as is are be we you our your will can need needs looking skilled experience required strong good ability work team etc ' +
  'this that have their also about into such more who has was not all any may must should years including using role join us they them').split(' '))
// short skills that the length filter would otherwise drop (none of these are stop words)
const SHORT = new Set(['ai', 'ml', 'ui', 'ux', 'qa', 'go', 'js', 'ts', 'hr', 'r', 'ci', 'cd'])

export const MAX_RESUME_CHARS = 200_000
export const MAX_JD_CHARS = 50_000

export type AtsResult = {
  score: number; formatScore: number; hasKeywords: boolean
  matched: string[]; missing: string[]
  sections: Record<'contact' | 'summary' | 'experience' | 'education' | 'skills', boolean>
  warnings: string[]
}

// ponytail: "ci/cd" splits into ci + cd; phrase matching would need a phrase list
const tokens = (t: string) => (t.toLowerCase().match(/\p{L}[\p{L}\p{N}+#.]*/gu) ?? []).map(w => w.replace(/\.+$/, ''))

const EMAIL_RE = /[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}/
// bounded candidate; digits are counted below so dates like "2019 - 2023" are not phones
const PHONE_CANDIDATE = /\+?\d[\d\s().-]{8,24}\d/g
export function hasPhone(text: string): boolean {
  for (const m of text.matchAll(PHONE_CANDIDATE)) {
    const groups = m[0].match(/\d+/g) ?? []
    if (groups.join('').length < 10) continue
    if (groups.every(g => /^(19|20)\d\d$/.test(g))) continue // a run of years
    return true
  }
  return false
}

/** Heading-ish: keyword at a line start, after a sentence/column boundary or 2 spaces, or followed by a colon. */
const heading = (words: string) =>
  new RegExp(`(?:(?:^|\\n)[ \\t]*|[.!?|\\u2022][ \\t]+|[ \\t]{2})(?:${words})\\b|\\b(?:${words})[ \\t]*:`, 'i')
const HEAD = {
  summary: heading('summary|objective|profile'),
  experience: heading('experience|work history|employment|internships?'),
  education: heading('education|academics?'),
  skills: heading('skills?|technical skills'),
}
const DEGREE_RE = /\b(?:b\.?tech|bachelor(?:'s|s)?|master(?:'s|s)? (?:of|in)|b\.?sc|m\.?sc|mba|degree in)\b/i

// ponytail: single-word keywords by frequency; phrase/synonym matching if scores feel too literal
export function scoreResume(resumeIn: string, jdIn: string): AtsResult {
  const warnings: string[] = []
  const text = resumeIn.slice(0, MAX_RESUME_CHARS).trim()
  const jd = jdIn.slice(0, MAX_JD_CHARS)
  if (resumeIn.length > MAX_RESUME_CHARS) warnings.push('Only the first 200,000 characters were analysed.')
  if (jdIn.length > MAX_JD_CHARS) warnings.push('Only the first 50,000 characters of the job description were analysed.')

  const have = new Set(tokens(text))
  const freq = new Map<string, number>()
  for (const w of tokens(jd)) if ((w.length > 2 || SHORT.has(w) || /[+#]/.test(w)) && !STOP.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1)
  const kws = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([w]) => w)
  const matched = kws.filter(k => have.has(k))
  const missing = kws.filter(k => !have.has(k))

  // collapse space runs so the heading regexes stay linear
  const flat = text.replace(/[ \t]{2,}/g, '  ')
  const sections = {
    contact: EMAIL_RE.test(text) && hasPhone(text),
    summary: HEAD.summary.test(flat),
    experience: HEAD.experience.test(flat),
    education: HEAD.education.test(flat) || DEGREE_RE.test(flat),
    skills: HEAD.skills.test(flat),
  }
  if (!sections.contact) warnings.push('Add a contact block with email and phone.')
  for (const [k, ok] of Object.entries(sections)) if (!ok && k !== 'contact') warnings.push(`Add a clear "${k}" section heading.`)
  const words = text ? text.split(/\s+/).length : 0
  if (words > 0 && words < 150) warnings.push('Resume looks very short.')
  if (words > 1200) warnings.push('Resume is long; aim for 1-2 pages.')

  if (!text) return { score: 0, formatScore: 0, hasKeywords: kws.length > 0, matched: [], missing: kws, sections, warnings: ['Resume text is empty.'] }
  const secScore = Object.values(sections).filter(Boolean).length / 5
  const formatScore = Math.round(secScore * 100)
  if (!kws.length) warnings.push('Add a job description with specific skills to get a keyword score.')
  const score = kws.length ? Math.round(((matched.length / kws.length) * 0.6 + secScore * 0.4) * 100) : 0
  return { score, formatScore, hasKeywords: kws.length > 0, matched, missing, sections, warnings }
}
