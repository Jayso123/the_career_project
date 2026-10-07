import { describe, it, expect } from 'vitest'
import { scoreResume } from './ats'

const resume = `Asha Rao asha@example.com +91 98765 43210
Summary: Data analyst with Python and SQL experience.
Experience: Built dashboards in Tableau and Python pipelines at Acme.
Education: B.Tech Computer Science
Skills: Python, SQL, Tableau, Excel`
const jd = 'We need a data analyst skilled in Python, SQL, Tableau and machine learning.'

describe('scoreResume', () => {
  it('matches keywords and flags the missing one', () => {
    const r = scoreResume(resume, jd)
    expect(r.matched).toEqual(expect.arrayContaining(['python', 'sql', 'tableau']))
    expect(r.missing).toContain('machine')
    expect(r.score).toBeGreaterThan(50)
  })
  it('detects all five sections', () => {
    expect(Object.values(scoreResume(resume, jd).sections).every(Boolean)).toBe(true)
  })
  it('empty resume scores 0 without throwing', () => {
    expect(scoreResume('', jd).score).toBe(0)
  })
  it('empty jd or only stop-words does not throw', () => {
    expect(() => scoreResume(resume, '')).not.toThrow()
    expect(() => scoreResume(resume, 'the and of to')).not.toThrow()
    expect(scoreResume(resume, '').missing).toEqual([])
  })
  it('a missing contact block is reported', () => {
    const r = scoreResume('Experience: worked. Skills: Python', jd)
    expect(r.sections.contact).toBe(false)
    expect(r.warnings.join(' ')).toMatch(/contact/i)
  })
})

describe('scoreResume edge cases', () => {
  it('whitespace-only resume scores 0', () => {
    expect(scoreResume('  \n\t  ', jd).score).toBe(0)
  })
  it('stop-word-only JD: no keywords, score 0, formatScore from sections, no NaN', () => {
    const r = scoreResume(resume, 'the and of to')
    expect(r.missing).toEqual([])
    expect(r.matched).toEqual([])
    expect(r.hasKeywords).toBe(false)
    expect(r.score).toBe(0)
    expect(r.formatScore).toBe(100)
  })
  it('empty JD: score 0, formatScore 100, hasKeywords false', () => {
    const r = scoreResume(resume, '')
    expect(r.score).toBe(0)
    expect(r.formatScore).toBe(100)
    expect(r.hasKeywords).toBe(false)
    expect(r.warnings.join(' ')).toMatch(/job description/i)
  })
  it('real JD sets hasKeywords', () => {
    expect(scoreResume(resume, jd).hasKeywords).toBe(true)
  })
  it('duplicate keywords are counted once', () => {
    const r = scoreResume(resume, 'python python python python sql')
    expect(r.matched.filter(k => k === 'python')).toHaveLength(1)
    expect(r.matched).toHaveLength(2)
  })
  it('is case-insensitive', () => {
    expect(scoreResume('PYTHON developer', 'python').matched).toContain('python')
    expect(scoreResume('python developer', 'PYTHON').matched).toContain('python')
  })
  it('matches punctuation-adjacent tokens', () => {
    const r = scoreResume('I know Python, SQL.', 'python sql')
    expect(r.matched).toEqual(expect.arrayContaining(['python', 'sql']))
  })
  it('handles 100k chars quickly', () => {
    const big = 'python sql tableau '.repeat(6000)
    const t = performance.now()
    scoreResume(big, big)
    expect(performance.now() - t).toBeLessThan(200)
  })
  it('preserves c++, c#, node.js', () => {
    const r = scoreResume('Skills: C++, C#, Node.js', 'c++ c# node.js')
    expect(r.matched).toEqual(expect.arrayContaining(['c++', 'c#', 'node.js']))
    expect(r.missing).toEqual([])
  })
  it('score is always an integer in 0..100', () => {
    for (const [a, b] of [['', ''], [resume, jd], [resume, ''], ['x', 'python sql'], [resume, resume]]) {
      const s = scoreResume(a, b).score
      expect(Number.isInteger(s)).toBe(true)
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(100)
    }
  })
})

describe('hardening', () => {
  const fast = (text: string) => {
    const t = performance.now()
    scoreResume(text, jd)
    return performance.now() - t
  }
  it('200k chars of one letter is fast', () => expect(fast('a'.repeat(200_000))).toBeLessThan(200))
  it('200k of a@ pairs is fast', () => expect(fast('a@'.repeat(100_000))).toBeLessThan(200))
  it('200k of digits/dashes is fast', () => expect(fast('1-'.repeat(100_000))).toBeLessThan(200))
  it('200k of spaces and repeated heading words is fast', () => {
    expect(fast(' '.repeat(200_000))).toBeLessThan(200)
    expect(fast('skills '.repeat(28_000))).toBeLessThan(200)
  })
  it('truncates and warns', () => {
    expect(scoreResume('python '.repeat(40_000), jd).warnings.join(' ')).toMatch(/first 200,000 characters/)
    expect(scoreResume(resume, 'python '.repeat(10_000)).warnings.join(' ')).toMatch(/first 50,000/)
    expect(scoreResume(resume, jd).warnings.join(' ')).not.toMatch(/200,000/)
  })
})

describe('tokenizer', () => {
  it('keeps accented words whole', () => {
    expect(scoreResume('Skills: résumé', 'résumé').matched).toEqual(['résumé'])
  })
  it('python3, .net and node.js', () => {
    const r = scoreResume('Skills: Python3, .NET, Node.js.', 'python3 .net node.js')
    expect(r.matched).toEqual(expect.arrayContaining(['python3', 'net', 'node.js']))
    expect(r.missing).toEqual([])
  })
  it('ci/cd splits into ci and cd (documented)', () => {
    expect(scoreResume('Skills: CI/CD', 'ci/cd').matched.sort()).toEqual(['cd', 'ci'])
  })
  it('short skills AI/ML/UX/Go/R are kept and matched', () => {
    const r = scoreResume('Skills: AI, ML, UX, Go, R', 'AI ML UX Go R')
    expect(r.matched).toEqual(expect.arrayContaining(['ai', 'ml', 'ux', 'go', 'r']))
    expect(r.missing).toEqual([])
  })
  it('extra stop words are ignored', () => {
    expect(scoreResume(resume, 'this should must including years').hasKeywords).toBe(false)
  })
})

describe('section false positives', () => {
  const base = (t: string) => scoreResume(t, '').sections
  it('"higher education guidance" in a sentence is not an Education section', () => {
    expect(base('I offer higher education guidance to students').education).toBe(false)
  })
  it('headings count: colon, line start, one-line PDF text', () => {
    expect(base('Education: B.Tech').education).toBe(true)
    expect(base('Name\nEducation\nCollege').education).toBe(true)
    expect(base('Asha Rao  Education  Skills  Python').education).toBe(true)
    expect(base('Asha Rao. Skills Python SQL').skills).toBe(true)
  })
  it('plain prose does not count', () => {
    const s = base('I like to share my experience and a profile of skills in prose')
    expect(s.experience).toBe(false)
    expect(s.summary).toBe(false)
    expect(s.skills).toBe(false)
  })
})

describe('phone detection', () => {
  const contact = (t: string) => scoreResume(t, '').sections.contact
  it('date ranges are not phones', () => {
    expect(contact('a@b.com 2019 - 2023 2')).toBe(false)
    expect(contact('a@b.com 2019 - 2023 - 2021 - 2022')).toBe(false)
  })
  it('real phones are', () => {
    expect(contact('a@b.com +91 98765 43210')).toBe(true)
    expect(contact('a@b.com 9876543210')).toBe(true)
    expect(contact('a@b.com (555) 123-4567')).toBe(true)
  })
})
