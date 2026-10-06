import { describe, it, expect } from 'vitest'
import { leadFromContact } from './leadFromContact'

describe('leadFromContact', () => {
  it('trims and maps message to goals', () => {
    expect(leadFromContact({ name: ' Asha ', email: ' a@b.co ', phone: ' 123 ', message: ' hi ' }))
      .toEqual({ name: 'Asha', email: 'a@b.co', phone: '123', goals: 'hi' })
  })
  it('defaults a missing phone to empty string', () => {
    expect(leadFromContact({ name: 'A', email: 'a@b.co', message: 'x' }).phone).toBe('')
    expect(leadFromContact({ name: 'A', email: 'a@b.co', phone: '  ', message: 'x' }).phone).toBe('')
  })
})
