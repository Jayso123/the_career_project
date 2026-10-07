import emailjs from '@emailjs/browser'
import { env } from './env'

export type Lead = {
  kind: 'booking' | 'contact'
  name: string; email: string; phone: string; requirements: string
  mentor?: string; plan?: string; slot?: string
}

export function buildEmailParams(l: Lead, ownerEmail: string): Record<string, string> {
  const lines = [
    `Name: ${l.name}`, `Email: ${l.email}`, `Phone: ${l.phone}`,
    ...(l.mentor ? [`Mentor: ${l.mentor}`] : []),
    ...(l.plan ? [`Plan: ${l.plan}`] : []),
    ...(l.slot ? [`Slot: ${l.slot}`] : []),
    `Requirements: ${l.requirements}`,
  ]
  return {
    to_email: ownerEmail,
    reply_to: l.email,
    subject: l.kind === 'booking' ? `New session booking: ${l.name}` : `New contact message: ${l.name}`,
    message: lines.join('\n'),
  }
}

const defaultSend = (params: Record<string, string>) =>
  emailjs.send(env.emailjs.serviceId!, env.emailjs.templateId!, params, { publicKey: env.emailjs.publicKey! })

export type Confirmation = { email: string; name: string; mentor: string; plan: string; slot: string; reference: string }

export function buildConfirmationParams(c: Confirmation, ownerEmail = ''): Record<string, string> {
  return {
    to_email: c.email, student_name: c.name || 'there', mentor: c.mentor, plan: c.plan,
    slot: c.slot, reference: c.reference, reply_to: ownerEmail,
  }
}

const defaultSendStudent = (params: Record<string, string>) =>
  emailjs.send(env.emailjs.serviceId!, env.emailjs.studentTemplateId!, params, { publicKey: env.emailjs.publicKey! })

// Booking confirmation to the student. Needs its own EmailJS template (To = {{to_email}}).
// ponytail: recipient comes from the browser; move to a server function if abuse appears.
export async function notifyStudent(
  c: Confirmation,
  send: (p: Record<string, string>) => Promise<unknown> = defaultSendStudent,
  templateId: string | undefined = env.emailjs.studentTemplateId,
): Promise<boolean> {
  if (!templateId || !c.email) return false
  try { await send(buildConfirmationParams(c, env.ownerEmail)); return true }
  catch (e) { console.error('notifyStudent failed', e); return false }
}

// Never throws: the booking/contact row is the source of truth, email is best effort.
export async function notifyOwner(
  lead: Lead,
  send: (p: Record<string, string>) => Promise<unknown> = defaultSend,
  ownerEmail: string | undefined = env.ownerEmail,
): Promise<boolean> {
  if (!ownerEmail) return false
  try { await send(buildEmailParams(lead, ownerEmail)); return true }
  catch (e) { console.error('notifyOwner failed', e); return false }
}
