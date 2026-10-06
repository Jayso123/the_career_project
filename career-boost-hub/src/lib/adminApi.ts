import type { SupabaseClient } from '@supabase/supabase-js'
import { safe } from './dashboardApi'
import type { BookingRow, Lead, Mentor, MentorValue, Status } from './adminLogic'

type Db = Pick<SupabaseClient, 'from'>
type Err = unknown | null
const one = <T>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] : v) ?? null
const MENTOR_COLS = 'id, name, title, company, bio, skills, rate_inr, photo_url'

export async function fetchBookings(db: Db) {
  const r = await safe<Record<string, unknown>[]>(() =>
    db
      .from('sessions')
      .select('id, starts_at, plan, requirements, status, mentors(name), profiles(full_name), payments(reference, mode)')
      .order('starts_at', { ascending: false }) as never,
  )
  const data =
    r.data?.map(({ mentors, profiles, payments, ...s }) => ({ ...s, mentor: one(mentors), student: one(profiles), payment: one(payments) }) as BookingRow) ?? null
  return { data, error: r.error }
}

export const fetchLeads = (db: Db) =>
  safe<Lead[]>(() => db.from('leads').select('id, name, email, phone, goals, created_at').order('created_at', { ascending: false }) as never)

export const fetchMentors = (db: Db) => safe<Mentor[]>(() => db.from('mentors').select(MENTOR_COLS).order('name') as never)

export const setSessionStatus = async (db: Db, id: string, status: Status): Promise<Err> =>
  (await safe(() => db.from('sessions').update({ status }).eq('id', id) as never)).error

export const createMentor = (db: Db, v: MentorValue) => safe<Mentor>(() => db.from('mentors').insert(v).select(MENTOR_COLS).single() as never)

export const updateMentor = (db: Db, id: string, v: MentorValue) =>
  safe<Mentor>(() => db.from('mentors').update(v).eq('id', id).select(MENTOR_COLS).single() as never)

export const deleteMentor = async (db: Db, id: string): Promise<Err> =>
  (await safe(() => db.from('mentors').delete().eq('id', id) as never)).error

/** Postgres foreign_key_violation: sessions.mentor_id is ON DELETE RESTRICT. */
export const isFkViolation = (e: unknown): boolean => (e as { code?: string } | null)?.code === '23503'
