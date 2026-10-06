export type Column = { key: string; header: string }

/** RFC-4180 field, plus formula-injection guard: text starting = + - @ TAB CR gets a leading single quote. */
function cell(v: unknown): string {
  let s = v == null ? '' : String(v)
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(rows: Record<string, unknown>[], columns: Column[]): string {
  const line = (vals: unknown[]) => vals.map(cell).join(',')
  return [line(columns.map((c) => c.header)), ...rows.map((r) => line(columns.map((c) => r[c.key])))].join('\r\n')
}
