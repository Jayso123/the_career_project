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
  it('stop-word-only JD: no missing, score from sections only, no NaN', () => {
    const r = scoreResume(resume, 'the and of to')
    expect(r.missing).toEqual([])
    expect(r.matched).toEqual([])
    expect(Number.isNaN(r.score)).toBe(false)
    expect(r.score).toBe(100) // all 5 sections, scaled to full range
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
