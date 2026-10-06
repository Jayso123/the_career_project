import { describe, it, expect } from 'vitest'
import { validateResumeFile, normalizeText, MAX_BYTES } from './readResumeFile'

const f = (name: string, size = 100, type = '') => ({ name, size, type })

describe('validateResumeFile', () => {
  it('accepts pdf/docx/txt, any case, with or without MIME', () => {
    expect(validateResumeFile(f('cv.pdf', 10, 'application/pdf'))).toBeNull()
    expect(validateResumeFile(f('CV.DOCX'))).toBeNull()
    expect(validateResumeFile(f('cv.txt', 10, 'text/plain'))).toBeNull()
  })
  it('rejects other types', () => {
    expect(validateResumeFile(f('cv.exe'))).toMatch(/Unsupported/)
    expect(validateResumeFile(f('noext'))).toMatch(/Unsupported/)
    expect(validateResumeFile(f('cv.doc'))).toMatch(/Unsupported/)
  })
  it('rejects extension/MIME mismatch', () => {
    expect(validateResumeFile(f('cv.pdf', 10, 'image/png'))).toMatch(/doesn't match/)
  })
  it('enforces size limits', () => {
    expect(validateResumeFile(f('cv.txt', MAX_BYTES))).toBeNull()
    expect(validateResumeFile(f('cv.txt', MAX_BYTES + 1))).toMatch(/too large/)
    expect(validateResumeFile(f('cv.txt', 0))).toMatch(/empty/)
  })
})

describe('normalizeText', () => {
  it('collapses whitespace, strips control chars, caps blank lines', () => {
    expect(normalizeText('a  \t b\r\n\r\n\r\n\r\nc\u0000d  ')).toBe('a b\n\nc d')
  })
})
