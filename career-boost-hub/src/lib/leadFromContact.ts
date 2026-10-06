export type ContactForm = { name: string; email: string; phone?: string; message: string }

// Maps the Contact form to the `leads` table row (message -> goals, phone defaults to '').
export const leadFromContact = (f: ContactForm) => ({
  name: f.name.trim(),
  email: f.email.trim(),
  phone: (f.phone ?? '').trim(),
  goals: f.message.trim(),
})
