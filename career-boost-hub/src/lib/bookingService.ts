import type { SupabaseClient } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/use-toast'
import { supabase } from './supabase'
import { notifyOwner } from './notify'
import { formatSlot, isUniqueViolation, mockReference } from './booking'
import type { OnPay, PayContext } from '../pages/Payment'

export type Outcome =
  | { ok: true; paymentId: string }
  | { ok: false; reason: 'mentor' | 'taken' | 'invalid' | 'error' | 'partial' }

type Db = Pick<SupabaseClient, 'from'>
type Who = { id: string; email?: string | null; fullName?: string }

/** Mock booking: session row -> payment row -> link -> owner email. Never throws. */
export async function runMockBooking(db: Db, ctx: PayContext, who: Who, send = notifyOwner): Promise<Outcome> {
  const { mentor, plan, startsAt, requirements = '', phone = '' } = ctx
  if (!startsAt) return { ok: false, reason: 'invalid' }
  let sessionId: string | undefined
  try {
    const m = await db.from('mentors').select('id, name').eq('name', mentor.name).maybeSingle()
    if (m.error || !m.data) return { ok: false, reason: 'mentor' }
    const s = await db
      .from('sessions')
      .insert({ student_id: who.id, mentor_id: m.data.id, starts_at: startsAt, plan: plan.name, requirements, status: 'booked' })
      .select('id')
      .single()
    if (s.error) return { ok: false, reason: isUniqueViolation(s.error) ? 'taken' : 'error' }
    sessionId = s.data.id as string
    const reference = mockReference()
    const p = await db
      .from('payments')
      .insert({ session_id: sessionId, student_id: who.id, amount_inr: ctx.amount, mode: 'mock', status: 'paid', reference })
      .select('id')
      .single()
    if (p.error) throw p.error
    const u = await db.from('sessions').update({ payment_id: p.data.id }).eq('id', sessionId)
    if (u.error) throw u.error
    // email is best effort: result never affects the booking
    await send({
      kind: 'booking',
      name: who.fullName || who.email || '',
      email: who.email ?? '',
      phone,
      requirements,
      mentor: mentor.name,
      plan: plan.name,
      slot: formatSlot(ctx.date, ctx.time),
    })
    return { ok: true, paymentId: reference }
  } catch (e) {
    console.error('booking failed', e)
    return { ok: false, reason: sessionId ? 'partial' : 'error' }
  }
}

const MESSAGES = {
  mentor: 'Mentor not found',
  taken: 'That slot was just taken',
  invalid: 'Booking details are incomplete. Please pick a slot again.',
  error: 'Booking failed. Please try again.',
  partial: 'Your booking was saved, but recording the payment failed. Please contact support before paying again.',
}

/** The onPay handed to <Payment/> (mock mode). Shows its own toasts and returns {cancelled} when not paid. */
export function useMockPay(): OnPay {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const fail = (description: string) => {
    toast({ title: 'Booking', description, variant: 'destructive' })
    return { cancelled: true }
  }
  return async (ctx) => {
    if (!supabase) return fail('Booking needs Supabase to be configured')
    if (!user) {
      toast({ title: 'Please log in to book' })
      const { amount: _amount, ...booking } = ctx
      navigate('/login', { state: { from: '/payment', booking } })
      return { cancelled: true }
    }
    const out = await runMockBooking(supabase, ctx, { id: user.id, email: user.email, fullName: profile?.full_name })
    if (out.ok) return { paymentId: out.paymentId }
    if (out.reason === 'taken') navigate(-1)
    return fail(MESSAGES[out.reason])
  }
}
