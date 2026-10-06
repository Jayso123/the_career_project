import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,14}$/, 'Enter a valid phone number'),
  goals: z.string().trim().min(10, 'Tell us a bit about your goals'),
})
export type ContactInput = z.infer<typeof contactSchema>
