# Career Boost Hub Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the careerboostmentor.lovable.app single-page marketing site as a local Vite/React project.

**Architecture:** One stateless component per section, fed by content arrays in `src/data/content.ts`, assembled in `src/pages/Index.tsx`. Only the Navbar (mobile toggle) and Contact (form) hold state. Form validation is a pure zod schema in `src/lib/contactSchema.ts` so it is unit-testable.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), lucide-react, zod, sonner, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-06-landing-page-design.md`

## Global Constraints

- Project dir: `C:\Users\jay soni\Desktop\final year\career-boost-hub`
- Prices exactly: Basic ₹299/session, Standard ₹699/session ("Most Popular"), Premium ₹1,199/month
- Stats exactly: 5000+ Students Guided, 98% Success Rate, 200+ Career Transitions
- Nav exactly: Home, Services, Pricing, Testimonials, Contact + "Book Session" CTA
- Contact form fields: Full Name, Email, Phone, Career Goals; button "Send Message"; note "No spam, ever"
- Blue/teal palette via CSS variables in `src/index.css`; responsive down to 375px
- No backend, no auth, no persistence in this sub-project

## Review Focus

- Whitespace-only name or goals must be rejected (trimmed before the length check)
- Indian phone numbers with +91, spaces, or dashes must be accepted; letters rejected
- Double-clicking Send Message must not fire two success toasts (disable while submitting)
- Mobile menu must close after a link is tapped
- Nav anchors must not hide section headings under the sticky navbar (`scroll-margin-top` in `index.css`)

## File Structure

- `src/lib/contactSchema.ts`: zod schema, one responsibility
- `src/lib/contactSchema.test.ts`: its tests
- `src/data/content.ts`: all copy and arrays
- `src/components/{Navbar,Hero,Stats,WhyChooseUs,Services,CareerPaths,Pricing,Testimonials,Contact,Footer,Icon}.tsx`
- `src/pages/Index.tsx`: assembles sections; `src/App.tsx` renders it plus `<Toaster />`

---

### Task 1: Scaffold project

**Files:** Create `career-boost-hub/` (Vite template), modify `vite.config.ts`, `src/index.css`, `package.json`

- [ ] **Step 1: Create and install**

```bash
cd "C:/Users/jay soni/Desktop/final year"
npm create vite@latest career-boost-hub -- --template react-ts
cd career-boost-hub
npm install
npm install tailwindcss @tailwindcss/vite lucide-react zod sonner
npm install -D vitest
```

- [ ] **Step 2: Configure** `vite.config.ts`

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: { environment: 'node' },
})
```

- [ ] **Step 3: Replace `src/index.css`** (delete `src/App.css`)

```css
@import "tailwindcss";

@theme {
  --color-brand: #2563eb;
  --color-brand-dark: #1d4ed8;
  --color-accent: #14b8a6;
  --color-ink: #0f172a;
  --color-soft: #f1f5f9;
}

html { scroll-behavior: smooth; }
body { font-family: system-ui, sans-serif; color: var(--color-ink); }
section[id] { scroll-margin-top: 5rem; }
```

- [ ] **Step 4:** Add `"test": "vitest run"` to `package.json` scripts.

- [ ] **Step 5: Verify** `npm run build` succeeds.

### Task 2: Contact schema (TDD)

**Files:** Create `src/lib/contactSchema.ts`, `src/lib/contactSchema.test.ts`

**Interfaces:** Produces `contactSchema` (zod object) and `type ContactInput`.

- [ ] **Step 1: Write failing test** `src/lib/contactSchema.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { contactSchema } from './contactSchema'

const ok = { name: 'Asha Rao', email: 'asha@example.com', phone: '+91 98765-43210', goals: 'Become a data scientist' }

describe('contactSchema', () => {
  it('accepts valid input incl. +91 and dashes', () => {
    expect(contactSchema.safeParse(ok).success).toBe(true)
  })
  it('rejects empty input', () => {
    expect(contactSchema.safeParse({ name: '', email: '', phone: '', goals: '' }).success).toBe(false)
  })
  it('rejects bad email', () => {
    expect(contactSchema.safeParse({ ...ok, email: 'nope' }).success).toBe(false)
  })
  it('rejects letters in phone', () => {
    expect(contactSchema.safeParse({ ...ok, phone: 'abc12345' }).success).toBe(false)
  })
  it('rejects whitespace-only name and goals', () => {
    expect(contactSchema.safeParse({ ...ok, name: '   ' }).success).toBe(false)
    expect(contactSchema.safeParse({ ...ok, goals: '     ' }).success).toBe(false)
  })
})
```

- [ ] **Step 2:** `npm test` → FAIL (module not found).

- [ ] **Step 3: Implement** `src/lib/contactSchema.ts`

```ts
import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,14}$/, 'Enter a valid phone number'),
  goals: z.string().trim().min(10, 'Tell us a bit about your goals'),
})
export type ContactInput = z.infer<typeof contactSchema>
```

- [ ] **Step 4:** `npm test` → PASS.

### Task 3: Content data

**Files:** Create `src/data/content.ts`

**Interfaces:** Produces named exports `nav`, `stats`, `reasons`, `services`, `paths`, `plans`, `testimonials`.

- [ ] **Step 1: Write** `src/data/content.ts`

```ts
export const nav = [
  { label: 'Home', href: '#home' },
  { label: 'Services', href: '#services' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Contact', href: '#contact' },
]

export const stats = [
  { value: '5000+', label: 'Students Guided' },
  { value: '98%', label: 'Success Rate' },
  { value: '200+', label: 'Career Transitions' },
]

// icon = lucide-react icon name
export const reasons = [
  { icon: 'UserCheck', title: 'Personalized Approach', text: 'Guidance tailored to your strengths, background and goals.' },
  { icon: 'Rocket', title: 'Fast Track Growth', text: 'Skip the guesswork with a clear, step-by-step plan.' },
  { icon: 'Target', title: 'Goal Oriented', text: 'Every session moves you toward a concrete milestone.' },
  { icon: 'TrendingUp', title: 'Real Results', text: 'Mentors who have placed students at top companies.' },
]

export const services = [
  { icon: 'Compass', title: 'Career Counseling', text: 'One-on-one sessions to find the right path for you.' },
  { icon: 'Map', title: 'Skill Roadmaps', text: 'Personalized learning plans for your target role.' },
  { icon: 'FileText', title: 'Resume Review', text: 'ATS-friendly resumes that get shortlisted.' },
  { icon: 'MessageSquare', title: 'Interview Prep', text: 'Mock interviews with actionable feedback.' },
  { icon: 'BarChart3', title: 'Industry Insights', text: 'Know what employers want, straight from insiders.' },
  { icon: 'GraduationCap', title: 'Higher Education Guidance', text: 'Choose courses and universities with confidence.' },
]

export const paths = [
  { title: 'Software Engineering', companies: ['Google', 'Microsoft', 'Amazon'] },
  { title: 'Data Science', companies: ['Flipkart', 'Mu Sigma', 'Fractal'] },
  { title: 'UX/UI Design', companies: ['Adobe', 'Swiggy', 'Razorpay'] },
  { title: 'Product Management', companies: ['Google', 'Flipkart', 'Uber'] },
  { title: 'Digital Marketing', companies: ['Ogilvy', 'Nykaa', 'Zomato'] },
  { title: 'Cybersecurity', companies: ['Cisco', 'Palo Alto', 'Deloitte'] },
]

export const plans = [
  { name: 'Basic', price: '₹299', unit: '/session', popular: false,
    features: ['1-on-1 career session', 'Session notes', 'Email support'] },
  { name: 'Standard', price: '₹699', unit: '/session', popular: true,
    features: ['Extended 1-on-1 session', 'Resume review', 'Personal skill roadmap', 'Chat support'] },
  { name: 'Premium', price: '₹1,199', unit: '/month', popular: false,
    features: ['Unlimited mentor chat', 'Weekly sessions', 'Mock interviews', 'Priority support'] },
]

export const testimonials = [
  { name: 'Priya Sharma', role: 'Software Engineer', company: 'Google', quote: 'The roadmap and mock interviews got me my offer in three months.' },
  { name: 'Rahul Verma', role: 'Cloud Engineer', company: 'Microsoft', quote: 'My mentor knew exactly which gaps to fix. Worth every rupee.' },
  { name: 'Ananya Iyer', role: 'Data Analyst', company: 'Amazon', quote: 'I switched from mechanical engineering to data in under a year.' },
  { name: 'Karan Mehta', role: 'Product Manager', company: 'Flipkart', quote: 'Resume review alone doubled my interview calls.' },
]
```

- [ ] **Step 2:** `npx tsc --noEmit -p tsconfig.app.json` → no errors.

### Task 4: Static sections

**Files:** Create `src/components/{Icon,Navbar,Hero,Stats,WhyChooseUs,Services,CareerPaths,Pricing,Testimonials,Footer}.tsx`

**Interfaces:** `Icon({ name, ...LucideProps })` renders a lucide icon by name. Each section is a default-export component with no props.

- [ ] **Step 1: `Icon.tsx`**

```tsx
import * as lucide from 'lucide-react'
import type { LucideProps } from 'lucide-react'

export default function Icon({ name, ...p }: { name: string } & LucideProps) {
  const C = (lucide as unknown as Record<string, React.ComponentType<LucideProps>>)[name] ?? lucide.Circle
  return <C {...p} />
}
```

- [ ] **Step 2: `Navbar.tsx`**

```tsx
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { nav } from '../data/content'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <a href="#home" className="font-bold text-xl text-brand">Career Boost Hub</a>
        <nav className="hidden md:flex items-center gap-6">
          {nav.map(n => <a key={n.href} href={n.href} className="text-sm hover:text-brand">{n.label}</a>)}
          <a href="#contact" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">Book Session</a>
        </nav>
        <button className="md:hidden" aria-label="Toggle menu" onClick={() => setOpen(o => !o)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="md:hidden flex flex-col gap-3 border-t px-4 py-4 bg-white">
          {nav.map(n => <a key={n.href} href={n.href} onClick={() => setOpen(false)}>{n.label}</a>)}
          <a href="#contact" onClick={() => setOpen(false)} className="rounded-lg bg-brand px-4 py-2 text-center text-white">Book Session</a>
        </nav>
      )}
    </header>
  )
}
```

- [ ] **Step 3: `Hero.tsx`**

```tsx
export default function Hero() {
  return (
    <section id="home" className="relative isolate overflow-hidden bg-gradient-to-br from-brand to-accent text-white">
      <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=60"
           alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-20" />
      <div className="mx-auto max-w-6xl px-4 py-24 md:py-36">
        <h1 className="max-w-3xl text-4xl md:text-6xl font-bold leading-tight">Transform Your Career with Expert Mentorship</h1>
        <p className="mt-6 max-w-xl text-lg text-white/90">Personalized guidance, skill roadmaps and interview prep from mentors who have been where you want to go.</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a href="#contact" className="rounded-lg bg-white px-6 py-3 font-semibold text-brand">Book Session</a>
          <a href="#services" className="rounded-lg border border-white px-6 py-3 font-semibold">Explore Services</a>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: `Stats.tsx`**

```tsx
import { stats } from '../data/content'

export default function Stats() {
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 sm:grid-cols-3 text-center">
        {stats.map(s => (
          <div key={s.label}>
            <div className="text-4xl font-bold text-accent">{s.value}</div>
            <div className="text-sm text-white/80">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: `WhyChooseUs.tsx` and `Services.tsx`**

```tsx
// WhyChooseUs.tsx
import Icon from './Icon'
import { reasons } from '../data/content'

export default function WhyChooseUs() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-center">Why Choose Us</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map(r => (
            <div key={r.title} className="rounded-xl border p-6 text-center">
              <Icon name={r.icon} className="mx-auto h-10 w-10 text-brand" />
              <h3 className="mt-4 font-semibold">{r.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

```tsx
// Services.tsx
import Icon from './Icon'
import { services } from '../data/content'

export default function Services() {
  return (
    <section id="services" className="bg-soft py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-center">Our Services</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(s => (
            <div key={s.title} className="rounded-xl bg-white p-6 shadow-sm">
              <Icon name={s.icon} className="h-8 w-8 text-accent" />
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: `CareerPaths.tsx`**

```tsx
import { paths } from '../data/content'

export default function CareerPaths() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-center">Popular Career Paths</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map(p => (
            <div key={p.title} className="rounded-xl border p-6">
              <h3 className="font-semibold">{p.title}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.companies.map(c => <span key={c} className="rounded-full bg-soft px-3 py-1 text-xs">{c}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 7: `Pricing.tsx`**

```tsx
import { Check } from 'lucide-react'
import { plans } from '../data/content'

export default function Pricing() {
  return (
    <section id="pricing" className="bg-soft py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-center">Simple, Affordable Pricing</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map(p => (
            <div key={p.name} className={`relative rounded-xl bg-white p-8 shadow-sm ${p.popular ? 'ring-2 ring-brand' : ''}`}>
              {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs text-white">Most Popular</span>}
              <h3 className="font-semibold">{p.name}</h3>
              <div className="mt-2"><span className="text-4xl font-bold">{p.price}</span><span className="text-slate-500">{p.unit}</span></div>
              <ul className="mt-6 space-y-2 text-sm">
                {p.features.map(f => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-accent" />{f}</li>)}
              </ul>
              <a href="#contact" className="mt-8 block rounded-lg bg-brand py-2 text-center text-white hover:bg-brand-dark">Get Started</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 8: `Testimonials.tsx`**

```tsx
import { testimonials } from '../data/content'

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-center">Success Stories</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {testimonials.map(t => (
            <figure key={t.name} className="rounded-xl border p-6">
              <blockquote className="text-slate-700">“{t.quote}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <img src={`https://i.pravatar.cc/80?u=${encodeURIComponent(t.name)}`} alt={t.name} className="h-10 w-10 rounded-full" />
                <div className="text-sm"><div className="font-semibold">{t.name}</div><div className="text-slate-500">{t.role}, {t.company}</div></div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 9: `Footer.tsx`**

```tsx
import { nav, services } from '../data/content'

export default function Footer() {
  return (
    <footer className="bg-ink text-white/80">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 sm:grid-cols-3 text-sm">
        <div><div className="text-lg font-bold text-white">Career Boost Hub</div><p className="mt-2">Affordable career mentorship for Indian students.</p></div>
        <div><div className="font-semibold text-white">Links</div><ul className="mt-2 space-y-1">{nav.map(n => <li key={n.href}><a href={n.href}>{n.label}</a></li>)}</ul></div>
        <div><div className="font-semibold text-white">Services</div><ul className="mt-2 space-y-1">{services.map(s => <li key={s.title}>{s.title}</li>)}</ul></div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs">
        © {new Date().getFullYear()} Career Boost Hub · <a href="#">Privacy</a> · <a href="#">Terms</a>
      </div>
    </footer>
  )
}
```

- [ ] **Step 10:** `npx tsc --noEmit -p tsconfig.app.json` → no errors.

### Task 5: Contact section and assembly

**Files:** Create `src/components/Contact.tsx`, `src/pages/Index.tsx`; replace `src/App.tsx`

**Interfaces:** Consumes `contactSchema` from Task 2.

- [ ] **Step 1: `Contact.tsx`**

```tsx
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
```

- [ ] **Step 2: `src/pages/Index.tsx`**

```tsx
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Stats from '../components/Stats'
import WhyChooseUs from '../components/WhyChooseUs'
import Services from '../components/Services'
import CareerPaths from '../components/CareerPaths'
import Pricing from '../components/Pricing'
import Testimonials from '../components/Testimonials'
import Contact from '../components/Contact'
import Footer from '../components/Footer'

export default function Index() {
  return (
    <>
      <Navbar /><Hero /><Stats /><WhyChooseUs /><Services /><CareerPaths />
      <Pricing /><Testimonials /><Contact /><Footer />
    </>
  )
}
```

- [ ] **Step 3: `src/App.tsx`**

```tsx
import { Toaster } from 'sonner'
import Index from './pages/Index'

export default function App() {
  return <><Index /><Toaster richColors position="top-center" /></>
}
```

- [ ] **Step 4: Verify** `npm test && npm run build` → both pass.

### Task 6: Visual verification

- [ ] **Step 1:** `npm run dev`, open the printed URL, check every section at desktop width and 375px (no horizontal scroll, mobile menu opens and closes on link tap, nav anchors land below the sticky header).
- [ ] **Step 2:** Submit empty form → inline errors; submit valid → one success toast, form clears.
- [ ] **Step 3:** Report to the user what differs from the live site, and ask for screenshots to refine.
