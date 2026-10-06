import { useState } from 'react'
import { toast } from 'sonner'
import { Mail, Phone, MessageCircle } from 'lucide-react'
import { contactSchema } from '../lib/contactSchema'

const empty = { name: '', email: '', phone: '', goals: '' }

export default function Contact() {
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    const r = contactSchema.safeParse(form)
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map(i => [String(i.path[0]), i.message])))
      return
    }
    setErrors({})
    setBusy(true)
    // ponytail: no persistence yet; sub-project 2 inserts into Supabase `leads`
    await new Promise(res => setTimeout(res, 400))
    toast.success("Thanks! We'll get back to you soon.")
    setForm(empty)
    setBusy(false)
  }

  const field = 'w-full rounded-lg border px-3 py-2'
  return (
    <section id="contact" className="bg-soft py-20">
      <div className="mx-auto max-w-6xl px-4 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold">Get in Touch</h2>
          <p className="mt-3 text-slate-600">Ready to boost your career? Reach out any way you like.</p>
          <div className="mt-6 space-y-3">
            <a href="mailto:hello@careerboosthub.in" className="flex items-center gap-3"><Mail className="text-brand" />hello@careerboosthub.in</a>
            <a href="tel:+919999999999" className="flex items-center gap-3"><Phone className="text-brand" />+91 99999 99999</a>
            <a href="https://wa.me/919999999999" className="flex items-center gap-3"><MessageCircle className="text-brand" />WhatsApp us</a>
          </div>
        </div>
        <form onSubmit={submit} noValidate className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          {([['name', 'Full Name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'tel']] as const).map(([k, label, type]) => (
            <label key={k} className="block text-sm font-medium">{label}
              <input type={type} value={form[k]} onChange={set(k)} className={field} />
              {errors[k] && <span className="text-xs text-red-600">{errors[k]}</span>}
            </label>
          ))}
          <label className="block text-sm font-medium">Career Goals
            <textarea rows={4} value={form.goals} onChange={set('goals')} className={field} />
            {errors.goals && <span className="text-xs text-red-600">{errors.goals}</span>}
          </label>
          <button disabled={busy} className="w-full rounded-lg bg-brand py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-60">
            {busy ? 'Sending…' : 'Send Message'}
          </button>
          <p className="text-center text-xs text-slate-500">No spam, ever.</p>
        </form>
      </div>
    </section>
  )
}
