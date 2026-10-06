const pad = (n: number) => String(n).padStart(2, '0')

/** Picked local calendar day + "09:00 AM" label, interpreted as IST, as a UTC ISO string. */
export function toStartsAtIso(date: Date, timeLabel: string): string {
  const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(timeLabel.trim())
  if (!m || Number.isNaN(date.getTime())) throw new Error(`Invalid slot: ${timeLabel}`)
  const h12 = Number(m[1])
  const min = Number(m[2])
  if (h12 < 1 || h12 > 12 || min > 59) throw new Error(`Invalid slot: ${timeLabel}`)
  const h = (h12 % 12) + (m[3] === 'PM' ? 12 : 0)
  const iso = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(h)}:${m[2]}:00+05:30`
  return new Date(iso).toISOString()
}

export const isUniqueViolation = (e: unknown): boolean => (e as { code?: string } | null)?.code === '23505'

export const mockReference = (): string => 'MOCK-' + crypto.randomUUID().slice(0, 8)

export const formatSlot = (date: string, time: string): string => `${date}, ${time} IST`
