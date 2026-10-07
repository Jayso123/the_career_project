import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

const cols = [{ key: 'a', header: 'A' }, { key: 'b', header: 'B' }]
describe('toCsv', () => {
  it('header only for empty rows, CRLF separators', () => {
    expect(toCsv([], cols)).toBe('A,B')
    expect(toCsv([{ a: '1', b: '2' }, { a: '3', b: '4' }], cols)).toBe('A,B\r\n1,2\r\n3,4')
  })
  it('quotes commas, newlines and doubles quotes', () => {
    expect(toCsv([{ a: 'x,y', b: 'say "hi"' }], cols)).toBe('A,B\r\n"x,y","say ""hi"""')
    expect(toCsv([{ a: 'l1\nl2', b: 'c\r\nd' }], cols)).toBe('A,B\r\n"l1\nl2","c\r\nd"')
  })
  it('neutralises formula cells', () => {
    const out = toCsv([{ a: '=HYPERLINK("http://x","y")', b: '+1' }, { a: '-2', b: '@SUM(A1)' }, { a: '\tx', b: '\rx' }], cols)
    expect(out).toContain(`"'=HYPERLINK(""http://x"",""y"")",'+1`)
    expect(out).toContain(`'-2,'@SUM(A1)`)
    expect(out).toContain(`'\tx,"'\rx"`)
  })
  it('keeps unicode, null and undefined cells', () => {
    expect(toCsv([{ a: '₹1,199', b: null }, { a: undefined, b: 5 }], cols)).toBe('A,B\r\n"₹1,199",\r\n,5')
  })
  it('quotes headers too', () => {
    expect(toCsv([], [{ key: 'a', header: 'Name, full' }])).toBe('"Name, full"')
  })
})
