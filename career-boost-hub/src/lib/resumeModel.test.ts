import { describe, expect, it } from 'vitest'
import { emptyResume, normalizeResume, safeUrl } from './resumeModel'

describe('safeUrl', () => {
  it.each([
    ['javascript:alert(1)', null],
    ['JaVaScript:alert(1)', null],
    ['data:text/html,<script>', null],
    ['//evil.com', null],
    ['mailto:a@b.c', null],
    ['http://a.b', null],
    ['', null],
    ['not a url', null],
    ['example.com', 'https://example.com/'],
    ['https://a.b/c?d=1', 'https://a.b/c?d=1'],
  ])('%s -> %s', (i, o) => expect(safeUrl(i)).toBe(o))
})

describe('hardening', () => {
  it.each([
    ['java\nscript:alert(1)', null],
    ['\tjavascript:alert(1)', null],
    ['https://u:p@h.com', null],
    ['https://good.com@evil.com', null],
    ['https:evil.com', null],
    ['example.com:8080/x', 'https://example.com:8080/x'],
    ['https://a.b/' + 'x'.repeat(2100), null],
  ])('safeUrl %s', (i, o) => expect(safeUrl(i)).toBe(o))
  it('dedupes duplicate ids', () => {
    const r = normalizeResume({ education: [{ id: 'a', degree: 'x' }, { id: 'a', degree: 'y' }], projects: [{ id: 'a', name: 'p' }] })
    const ids = [...r.education.map((e) => e.id), ...r.projects.map((e) => e.id)]
    expect(new Set(ids).size).toBe(3)
    expect(r.education[0].id).toBe('a')
  })
})

describe('normalizeResume', () => {
  it('defaults for junk', () => {
    for (const j of [null, undefined, 'x', 5, [], [1], true]) {
      const r = normalizeResume(j)
      expect(r.template).toBe('classic')
      expect(r.experience).toEqual([])
      expect(r.personal.links).toEqual([])
    }
  })
  it('arrays where objects expected / wrong types', () => {
    const r = normalizeResume({ personal: [], summary: 5, experience: { a: 1 }, education: 'x', skills: 'a', projects: [null, 3, 'x'], template: 'evil' })
    expect(r).toMatchObject({ template: 'classic', summary: '', experience: [], education: [], skills: [] })
    expect(r.projects).toEqual([])
  })
  it('caps lengths and counts, trims', () => {
    const r = normalizeResume({
      personal: { name: '  ' + 'a'.repeat(500) + '  ', links: Array(20).fill('x.com') },
      summary: 's'.repeat(5000),
      experience: Array(50).fill({ role: 'r'.repeat(300), bullets: Array(30).fill('b'.repeat(900)) }),
      education: Array(50).fill({ degree: 'd' }),
      skills: Array(100).fill('k'),
      projects: Array(50).fill({ name: 'p' }),
    })
    expect(r.personal.name).toHaveLength(120)
    expect(r.personal.links).toHaveLength(5)
    expect(r.summary).toHaveLength(1000)
    expect(r.experience).toHaveLength(10)
    expect(r.experience[0].role).toHaveLength(120)
    expect(r.experience[0].bullets).toHaveLength(8)
    expect(r.experience[0].bullets[0]).toHaveLength(300)
    expect(r.education).toHaveLength(6)
    expect(r.skills).toHaveLength(30)
    expect(r.projects).toHaveLength(8)
  })
  it('keeps XSS as plain text and assigns ids', () => {
    const x = '<img src=x onerror=alert(1)>'
    const r = normalizeResume({ personal: { name: x }, education: [{ degree: x }] })
    expect(r.personal.name).toBe(x)
    expect(r.education[0].degree).toBe(x)
    expect(r.education[0].id).toMatch(/^[0-9a-f-]{36}$/)
  })
  it('is idempotent on valid data', () => {
    const r = normalizeResume({ template: 'modern', summary: 'hi', skills: ['a', ' b '] })
    expect(r.template).toBe('modern')
    expect(r.skills).toEqual(['a', 'b'])
    expect(normalizeResume(r)).toEqual(r)
    expect(emptyResume()).toEqual(normalizeResume(null))
  })
})
