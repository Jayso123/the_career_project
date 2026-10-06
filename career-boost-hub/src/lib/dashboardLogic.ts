type HasDue = { due_on: string | null }

/** Booked sessions strictly in the future are upcoming (soonest first); everything else is past (newest first). */
export function splitSessions<T extends { starts_at: string; status: string }>(sessions: T[], now: Date) {
  const t = now.getTime()
  const ms = (s: T) => new Date(s.starts_at).getTime()
  const upcoming = sessions.filter((s) => s.status === 'booked' && ms(s) > t).sort((a, b) => ms(a) - ms(b))
  const past = sessions.filter((s) => !(s.status === 'booked' && ms(s) > t)).sort((a, b) => ms(b) - ms(a))
  return { upcoming, past }
}

/** `today` is a local YYYY-MM-DD; ISO dates compare correctly as strings. */
export const isOverdue = (item: HasDue & { done: boolean }, today: string): boolean =>
  !!item.due_on && !item.done && item.due_on < today

export const progress = (items: { done: boolean }[]): number =>
  items.length ? Math.round((items.filter((i) => i.done).length / items.length) * 100) : 0

/** Due date ascending, nulls last; ties keep input (creation) order. */
export const sortByDue = <T extends HasDue>(items: T[]): T[] =>
  items
    .map((x, i) => [x, i] as const)
    .sort(([a, i], [b, j]) => (a.due_on === b.due_on ? i - j : a.due_on === null ? 1 : b.due_on === null ? -1 : a.due_on < b.due_on ? -1 : 1))
    .map(([x]) => x)

export const todayLocal = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** "Tue, 6 Oct 2026 · 09:00 AM IST" */
export function formatIst(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Invalid date'
  const o = { timeZone: 'Asia/Kolkata' } as const
  const date = d.toLocaleDateString('en-GB', { ...o, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace(/^(\w+),?/, '$1,')
  const time = d.toLocaleTimeString('en-US', { ...o, hour: '2-digit', minute: '2-digit', hour12: true })
  return `${date} · ${time} IST`
}
