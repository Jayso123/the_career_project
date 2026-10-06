import { describe, it, expect } from 'vitest'
import { contactSchema } from './contactSchema'

const ok = { name: 'Asha Rao', email: 'asha@example.com', phone: '+91 98765-43210', goals: 'Become a data scientist' }

describe('contactSchema', () => {
  it('accepts valid input incl. +91 and dashes', () => {
    expect(contactSchema.safeParse(ok).success).toBe(true)
  })
  it('rejects empty input', () => {
    expect(contactSchema.safeParse({ name: '', email: '', phone: '', goals: '' }).success).toBe(false)
  })
  it('rejects bad email', () => {
    expect(contactSchema.safeParse({ ...ok, email: 'nope' }).success).toBe(false)
  })
  it('rejects letters in phone', () => {
    expect(contactSchema.safeParse({ ...ok, phone: 'abc12345' }).success).toBe(false)
  })
  it('rejects whitespace-only name and goals', () => {
    expect(contactSchema.safeParse({ ...ok, name: '   ' }).success).toBe(false)
    expect(contactSchema.safeParse({ ...ok, goals: '     ' }).success).toBe(false)
  })
})
