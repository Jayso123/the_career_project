import { z } from 'zod'

export type Status = 'booked' | 'completed' | 'cancelled'
export type BookingRow = {
  id: string
  starts_at: string
  plan: string
  requirements: string
  status: Status
  mentor: { name: string } | null
  student: { full_name: string } | null
  payment: { reference: string; mode: string } | null
}
export type Lead = { id: string; name: string; email: string; phone: string; goals: string; created_at: string }
export type Mentor = {
  id: string; name: string; title: string; company: string; bio: string; skills: string[]; rate_inr: number; photo_url: string | null
}

const has = (hay: (string | null | undefined)[], q: string) => hay.some((h) => (h ?? '').toLowerCase().includes(q))

export const filterBookings = (rows: BookingRow[], status: Status | 'all', query: string): BookingRow[] => {
  const q = query.trim().toLowerCase()
  return rows.filter(
    (r) => (status === 'all' || r.status === status) && (!q || has([r.student?.full_name, r.mentor?.name, r.requirements], q)),
  )
}

export const filterLeads = (rows: Lead[], query: string): Lead[] => {
  const q = query.trim().toLowerCase()
  return q ? rows.filter((r) => has([r.name, r.email, r.phone, r.goals], q)) : rows
}

const mentorSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Max 100 characters'),
  title: z.string().trim().max(100, 'Max 100 characters'),
  company: z.string().trim().max(100, 'Max 100 characters'),
  bio: z.string().trim().max(1000, 'Max 1000 characters'),
  skills: z.string().transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),
  rate_inr: z.string().trim().regex(/^\d+$/, 'Enter a whole number, 0 or more').transform(Number),
  photo_url: z
    .string()
    .trim()
    .refine((u) => {
      if (!u) return true
      try {
        return new URL(u).protocol === 'https:'
      } catch {
        return false
      }
    }, 'Must be an https:// URL')
    .transform((u) => u || null),
})
export type MentorInput = z.input<typeof mentorSchema>
export type MentorValue = z.output<typeof mentorSchema>

export function validateMentor(input: MentorInput): { ok: true; value: MentorValue } | { ok: false; errors: Record<string, string> } {
  const r = mentorSchema.safeParse(input)
  if (r.success) return { ok: true, value: r.data }
  const errors: Record<string, string> = {}
  for (const i of r.error.issues) errors[String(i.path[0])] ??= i.message
  return { ok: false, errors }
}
