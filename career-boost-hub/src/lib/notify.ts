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
