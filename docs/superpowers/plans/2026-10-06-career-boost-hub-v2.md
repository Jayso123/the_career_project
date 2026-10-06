# Career Boost Hub v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild careerboostmentor.lovable.app as a near-pixel-exact clone, then add auth, dashboard, mentors, booking + mock payment, admin, ATS checker, resume builder, and owner notification emails.

**Architecture:** Vite + React + TS app in `career-boost-hub/`. The clone pages are extracted from the live site's bundle (`.superpowers/ref/site.js`) so markup and classes are identical. Feature pages sit on Supabase (auth + Postgres + RLS). Pure logic (ATS scorer, notification payload, booking slots) lives in `src/lib/` with Vitest tests; pages are thin.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind **v3** + tailwindcss-animate (shadcn tokens), react-router-dom, framer-motion, gsap, lucide-react, @supabase/supabase-js, @emailjs/browser, pdfjs-dist, mammoth, zod, sonner, Vitest, Playwright + pixelmatch + pngjs (dev, screenshot diff).

**Spec:** `docs/superpowers/specs/2026-10-06-career-boost-hub-v2-design.md`

## Global Constraints

- Project dir: `C:\Users\jay soni\Desktop\final year\career-boost-hub`; reference assets: `C:\Users\jay soni\Desktop\final year\.superpowers\ref\{index.html,site.css,site.js,hero-bg.jpg}` (never shipped, never committed)
- Fonts: Inter (body), Plus Jakarta Sans (headings). Tokens (HSL, light): background `210 25% 98%`, foreground `215 35% 15%`, card `0 0% 100%`, primary `215 65% 18%`, primary-foreground `210 25% 98%`, secondary `210 20% 94%`, muted `210 15% 92%`, muted-foreground `215 15% 45%`, accent `175 65% 40%`, accent-foreground `0 0% 100%`, border `210 20% 88%`, radius `.75rem`; dark set as in `site.css` `.dark`
- Prices exactly: Basic ₹299/session, Standard ₹699/session ("Most Popular"), Premium ₹1,199/month. Stats: 5000+ Students Guided, 98% Success Rate, 200+ Career Transitions
- Routes in the clone: `/`, `/payment`, `*`. Added: `/login`, `/signup`, `/dashboard`, `/mentors`, `/mentors/:id`, `/book/:mentorId`, `/admin`, `/ats-checker`, `/resume-builder`
- **Login** button sits immediately LEFT of "Book Session" in the navbar (desktop and mobile menu); when signed in it becomes an account menu
- Secrets only in `career-boost-hub/.env` (gitignored). Never print or commit key values. `.env.example` lists: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_PAYMENT_MODE=mock, VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY, VITE_OWNER_EMAIL
- With empty Supabase keys the app must not crash: `supabase` is `null`, feature pages render a `<ConnectSupabase />` notice
- Lovable badge and `/~flock.js` are NOT copied
- Commit author: `git -c user.name=Claude -c user.email=noreply@anthropic.com`; repo root is `final year`, branch `build/landing-page`

## Review Focus

- RLS: a student must never read another student's sessions/roadmap/resumes; `leads` readable by admin only; role must not be self-promotable (profile update cannot change `role`)
- Booking the same mentor + `starts_at` twice must be rejected (unique constraint) and shown as "slot taken"
- Notification email failure (network down, blank EmailJS keys) must not fail the booking or contact submit
- ATS scorer on empty resume, empty job description, and a JD of only stop-words must return a score of 0 without throwing
- Resume builder with zero experience/education entries must still render the preview and print without blank-page artefacts
- Mock payment must be impossible to confuse with real: reference always `MOCK-` prefix, `mode='mock'`
- Protected routes must redirect to `/login` (not flash content) while the session is loading

## File Structure

```
career-boost-hub/
  tailwind.config.ts, postcss.config.js
  scripts/extract.mjs          # prints the minified JSX around a text anchor from site.js
  scripts/shotdiff.mjs         # live vs local screenshot diff per section
  supabase/migrations/0001_init.sql, supabase/seed.sql
  src/lib/{supabase,env,notify,ats,slots,contactSchema}.ts (+ .test.ts for notify, ats, slots, contactSchema)
  src/context/AuthContext.tsx
  src/components/clone/*       # Navbar, Hero, Stats, WhyChooseUs, Services, CareerPaths, Pricing, Testimonials, Contact, Footer
  src/components/{ProtectedRoute,ConnectSupabase,AccountMenu,ResumePreview}.tsx
  src/pages/{Index,Payment,NotFound,Login,Signup,Dashboard,Mentors,MentorProfile,Book,Admin,AtsChecker,ResumeBuilder}.tsx
```

## Plan note on UI tasks

Logic modules, SQL and the extraction/diff scripts have full code below. Page UI for the new feature pages (Tasks 10-14) is given as a precise contract (data, states, behaviours, styling source) rather than full JSX; reviewers check each page against its contract. Clone pages (Tasks 2-5) are by definition transcribed from the bundle with `scripts/extract.mjs`.

---

## Part A: Exact clone

### Task 1: Reset to Tailwind v3 + shadcn tokens

**Files:** modify `package.json`, `vite.config.ts`, `src/index.css`, `index.html`, `src/main.tsx`, `src/App.tsx`; create `tailwind.config.ts`, `postcss.config.js`, `src/pages/{Index,Payment,NotFound}.tsx` (stubs); delete the retired `src/components/*` and `src/data/content.ts`; keep `src/lib/contactSchema.ts` and its test

- [ ] **Step 1: Swap dependencies**

```bash
cd "C:/Users/jay soni/Desktop/final year/career-boost-hub"
npm uninstall tailwindcss @tailwindcss/vite
npm install -D tailwindcss@3 postcss autoprefixer tailwindcss-animate
npm install react-router-dom framer-motion gsap @fontsource/inter @fontsource/plus-jakarta-sans
```

- [ ] **Step 2: `postcss.config.js`**: `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }`. In `vite.config.ts` remove the tailwind plugin import/usage (keep react + the vitest `test` block).

- [ ] **Step 3: Derive the theme from the live CSS.** Read `.superpowers/ref/site.css` and build `tailwind.config.ts` so that it reproduces exactly: `darkMode: ['class']`, `container` settings, `fontFamily` (`sans: Inter`, `heading: Plus Jakarta Sans`), color keys `border, input, ring, background, foreground, primary(+foreground), secondary, muted, accent, card, popover, destructive` mapped to `hsl(var(--x))`, `borderRadius` lg/md/sm from `--radius`, and every custom `keyframes`/`animation`/`boxShadow`/`backgroundImage` utility that appears in `site.css` (grep `@keyframes`, `.shadow-`, `.bg-gradient`). Copy the `:root` and `.dark` variable blocks verbatim into `src/index.css` under `@tailwind base; @tailwind components; @tailwind utilities;`, plus the base-layer rules found in `site.css` (body font, heading font, borders). Import the font weights `site.css` uses from `@fontsource/inter` and `@fontsource/plus-jakarta-sans` in `main.tsx`.

- [ ] **Step 4:** Copy `.superpowers/ref/hero-bg.jpg` to `src/assets/hero-bg.jpg`. Copy `<title>`, description, keywords, author, OG and Twitter meta from `.superpowers/ref/index.html` into `career-boost-hub/index.html` (not the badge style/script, not `/~flock.js`).

- [ ] **Step 5: `src/App.tsx`** with `BrowserRouter`, routes `/` → `Index`, `/payment` → `Payment`, `*` → `NotFound` (stub pages returning a `<div>` for now), and `<Toaster />` from sonner.

- [ ] **Step 6: Verify** `npm run build` succeeds; `npm test` still passes for `contactSchema`. Commit `chore: switch to tailwind v3 shadcn tokens, router, fonts`.

### Task 2: Extraction helper + navbar/hero/stats

**Files:** create `scripts/extract.mjs`, `src/components/clone/{Navbar,Hero,Stats}.tsx`; modify `src/pages/Index.tsx`

- [ ] **Step 1: `scripts/extract.mjs`**: prints the source window around each occurrence of an anchor in `site.js`.

```js
import { readFileSync } from 'node:fs'
const [anchor, width = '3000'] = process.argv.slice(2)
const src = readFileSync(new URL('../../.superpowers/ref/site.js', import.meta.url), 'utf8')
let i = -1, n = 0
while ((i = src.indexOf(anchor, i + 1)) !== -1 && n < 5) {
  console.log(`--- match ${++n} @${i} ---\n` + src.slice(Math.max(0, i - width / 2), i + width / 2) + '\n')
}
if (!n) { console.error('no match'); process.exit(1) }
```

- [ ] **Step 2: Navbar.** Run `node scripts/extract.mjs "Book Session" 4000` and recreate the header: same JSX tree, same `className` strings, same scroll-state logic (transparent over the hero with `text-primary-foreground`, solid with `text-foreground` after scroll), same mobile menu. Translate minified identifiers to the lucide icon names they reference (resolve each short icon id such as `e5`/`Yw` by finding its definition in `site.js`). **Add the Login button** immediately left of Book Session: `<Link to="/login">` styled as the site's outline button variant; in the mobile menu add it above Book Session. "Book Session" scrolls to `#contact` as the site does.
- [ ] **Step 3: Hero + Stats.** Extract with anchors for the hero headline text and `"Students Guided"`; recreate with identical copy, classes, `hero-bg.jpg` import, framer-motion props, and the stats icons (`c5`, `FL`, `a5` → resolve names).
- [ ] **Step 4:** Assemble in `Index.tsx`, run the dev server, compare by eye against the live site, then `npm run build`. Commit `feat(clone): navbar with login button, hero, stats`.

### Task 3: Why Choose Us, Services, Career Paths

**Files:** create `src/components/clone/{WhyChooseUs,Services,CareerPaths}.tsx`; modify `Index.tsx`

- [ ] **Step 1:** Extract with anchors `"Personalized Approach"`, `"Resume Review"` and `"Software Engineering"`. Recreate each: data arrays verbatim, same classNames, same animation props (framer-motion `whileInView`; replicate GSAP/ScrollTrigger usage if present, with the same selectors and timings), company names exactly as in the bundle.
- [ ] **Step 2:** Assemble, build, commit `feat(clone): why-choose-us, services, career paths`.

### Task 4: Pricing, Testimonials, Contact, Footer

**Files:** create `src/components/clone/{Pricing,Testimonials,Contact,Footer}.tsx`; modify `Index.tsx`

- [ ] **Step 1:** Extract with anchors `"Most Popular"`, the testimonials heading (find with `node scripts/extract.mjs "Flipkart"`), `"Send Message"`, and the footer copyright text. Recreate identically: pricing cards and the footnote ("All plans inc…" text found in the bundle), testimonial cards exactly as built in the bundle (download any asset URL it references into `src/assets/`), contact channels (email, phone, WhatsApp values from the bundle) and form fields, footer columns.
- [ ] **Step 2:** The contact form keeps the live site's fields and labels. Submit validates with `contactSchema` (existing) and shows the site's success toast; persistence and email come in Task 9.
- [ ] **Step 3:** Assemble, build, commit `feat(clone): pricing, testimonials, contact, footer`.

### Task 5: Payment page + NotFound

**Files:** create/replace `src/pages/Payment.tsx`, `src/pages/NotFound.tsx`

- [ ] **Step 1:** Find the payment route component (`node scripts/extract.mjs 'path:"/payment"' 1500`, then locate the component by the identifier it references; also search anchors like `"Payment"`). Recreate it 1:1, including what it reads from router state/search params, and the NotFound page (anchor `"404"`). Where the original performs a fake or real charge, keep the visuals and route the action through an `onPay()` callback prop so Task 10 can plug in mock payment; with no callback it behaves as the original.
- [ ] **Step 2:** Build, commit `feat(clone): payment page and not found`.

### Task 6: Screenshot-diff script and fidelity pass

**Files:** create `scripts/shotdiff.mjs`; modify clone components as needed

- [ ] **Step 1:**

```bash
npm i -D playwright pixelmatch pngjs
npx playwright install chromium
```

- [ ] **Step 2: `scripts/shotdiff.mjs`**: for widths 1280 and 375, open `https://careerboostmentor.lovable.app/` and `http://127.0.0.1:5173/`, hide `#lovable-badge` on the live page, scroll through the page to fire `whileInView`, wait 1500ms, screenshot every `header`/`section`/`footer` element by index, and compare each pair with pixelmatch (`threshold: 0.1`). Print one line per section: `index tagName diffPercent`. Exit non-zero if any exceeds 0.5%. Sections with different heights are reported as FAIL with both heights. (The Login button is an intended difference: the navbar row is compared with that button masked.)
- [ ] **Step 3:** Run it, fix every section over 0.5% (typical causes: font weight, spacing class, image size, animation end state), re-run until clean. Record the final table in `.superpowers/ref/fidelity.md`.
- [ ] **Step 4:** Commit `test: screenshot diff script; clone within 0.5%`.

## Part B: Features

### Task 7: Supabase client, env, migration, auth, Login button

**Files:** create `src/lib/env.ts`, `src/lib/supabase.ts`, `supabase/migrations/0001_init.sql`, `src/context/AuthContext.tsx`, `src/components/{ProtectedRoute,ConnectSupabase,AccountMenu}.tsx`, `src/pages/{Login,Signup}.tsx`; modify `Navbar.tsx`, `App.tsx`; install `@supabase/supabase-js`

**Interfaces:** Produces `supabase: SupabaseClient | null`, `useAuth(): { user, profile, loading, signIn, signUp, signOut }`, `<ProtectedRoute role?>`.

- [ ] **Step 1: `src/lib/env.ts`**

```ts
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  paymentMode: (import.meta.env.VITE_PAYMENT_MODE as string | undefined) ?? 'mock',
  emailjs: {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined,
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined,
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined,
  },
  ownerEmail: import.meta.env.VITE_OWNER_EMAIL as string | undefined,
}
```

- [ ] **Step 2: `src/lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js'
import { env } from './env'

export const supabase = env.supabaseUrl && env.supabaseAnonKey
  ? createClient(env.supabaseUrl, env.supabaseAnonKey)
  : null
```

- [ ] **Step 3: `supabase/migrations/0001_init.sql`**

```sql
create type app_role as enum ('student', 'mentor', 'admin');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  role app_role not null default 'student'
);

create table mentors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles on delete set null,
  name text not null, title text not null default '', company text not null default '',
  bio text not null default '', skills text[] not null default '{}',
  rate_inr int not null default 299, photo_url text
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles on delete cascade,
  mentor_id uuid not null references mentors on delete restrict,
  starts_at timestamptz not null,
  plan text not null check (plan in ('Basic','Standard','Premium')),
  requirements text not null default '',
  status text not null default 'booked' check (status in ('booked','completed','cancelled')),
  payment_id uuid,
  created_at timestamptz not null default now(),
  unique (mentor_id, starts_at)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions on delete cascade,
  student_id uuid not null references profiles on delete cascade,
  amount_inr int not null,
  mode text not null check (mode in ('mock','razorpay')),
  status text not null default 'paid',
  reference text not null
);

create table roadmap_items (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles on delete cascade,
  title text not null, detail text not null default '', due_on date, done boolean not null default false
);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles on delete cascade,
  title text not null, kind text not null default 'interview_prep', due_on date, done boolean not null default false
);

create table resumes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references profiles on delete cascade,
  data jsonb not null default '{}', updated_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, phone text not null, goals text not null,
  created_at timestamptz not null default now()
);

create function is_admin() returns boolean language sql security definer stable as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;

create function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

alter table profiles enable row level security;
alter table mentors enable row level security;
alter table sessions enable row level security;
alter table payments enable row level security;
alter table roadmap_items enable row level security;
alter table milestones enable row level security;
alter table resumes enable row level security;
alter table leads enable row level security;

-- profiles: read own or admin; update own row but the role is locked to its current value
create policy profiles_read on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_update on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

-- mentors: public read, admin write
create policy mentors_read on mentors for select using (true);
create policy mentors_admin on mentors for all using (is_admin()) with check (is_admin());

-- sessions: student own, mentor own, admin all
create policy sessions_read on sessions for select using (
  student_id = auth.uid() or is_admin()
  or mentor_id in (select id from mentors where profile_id = auth.uid()));
create policy sessions_insert on sessions for insert with check (student_id = auth.uid());
create policy sessions_update on sessions for update using (student_id = auth.uid() or is_admin());

create policy payments_read on payments for select using (student_id = auth.uid() or is_admin());
create policy payments_insert on payments for insert with check (student_id = auth.uid());

create policy roadmap_own on roadmap_items for all using (student_id = auth.uid() or is_admin()) with check (student_id = auth.uid() or is_admin());
create policy milestones_own on milestones for all using (student_id = auth.uid() or is_admin()) with check (student_id = auth.uid() or is_admin());
create policy resumes_own on resumes for all using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy leads_insert on leads for insert to anon, authenticated with check (true);
create policy leads_read on leads for select using (is_admin());
```

Also append to the same migration (students cannot read other students' sessions, so booked slots are exposed only as times):

```sql
create function taken_slots(p_mentor uuid) returns setof timestamptz
language sql security definer stable as
$$ select starts_at from sessions where mentor_id = p_mentor and status <> 'cancelled' and starts_at > now() $$;
grant execute on function taken_slots(uuid) to anon, authenticated;
```

- [ ] **Step 4: `AuthContext.tsx`**: on mount `supabase.auth.getSession()` + `onAuthStateChange`; load the `profiles` row for the user; expose `{ user, profile, loading, signIn(email,password), signUp(email,password,fullName), signOut }`. When `supabase` is null: `loading=false`, `user=null`, and all actions return `{ error: 'Supabase not configured' }`.
- [ ] **Step 5: `ProtectedRoute.tsx`**: while `loading` render a spinner (never the child); no user → `<Navigate to="/login" replace state={{ from }}/>`; `role` prop set and `profile.role` mismatched → `<Navigate to="/dashboard"/>`. `ConnectSupabase.tsx`: card explaining to fill `.env` and run the migration, shown by pages when `supabase === null`.
- [ ] **Step 6: Login/Signup pages** styled with the clone's tokens (card, input, button classes taken from the clone's contact form): email/password, zod validation (email valid, password ≥ 8), error text from Supabase, redirect to `state.from ?? '/dashboard'`. Signup also collects Full name.
- [ ] **Step 7: Navbar:** `Login` button left of `Book Session` when `!user`; `AccountMenu` (name, Dashboard, Admin if admin, Log out) when signed in; same in the mobile menu.
- [ ] **Step 8: Verify** `npm run build`; with blank env the home page still works and `/login` shows the form with a "not configured" error on submit. Commit `feat: supabase client, migration, auth, login button`.

### Task 8: Notification module (test-first)

**Files:** create `src/lib/notify.ts`, `src/lib/notify.test.ts`; install `@emailjs/browser`

**Interfaces:** Produces `type Lead`, `buildEmailParams(lead, ownerEmail)`, `notifyOwner(lead, send?, ownerEmail?)`.

- [ ] **Step 1: Failing test `src/lib/notify.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest'
import { buildEmailParams, notifyOwner, type Lead } from './notify'

const booking: Lead = {
  kind: 'booking', name: 'Asha Rao', email: 'asha@example.com', phone: '+91 98765 43210',
  requirements: 'Switch to data science', mentor: 'Priya Sharma', plan: 'Standard', slot: '2026-11-02T10:00:00Z',
}

describe('notify', () => {
  it('builds params with every detail the owner needs', () => {
    const p = buildEmailParams(booking, 'owner@example.com')
    expect(p.to_email).toBe('owner@example.com')
    expect(p.subject).toBe('New session booking: Asha Rao')
    for (const s of ['Asha Rao', 'asha@example.com', '+91 98765 43210', 'Switch to data science', 'Priya Sharma', 'Standard'])
      expect(p.message).toContain(s)
    expect(p.reply_to).toBe('asha@example.com')
  })
  it('contact kind has its own subject and no mentor lines', () => {
    const p = buildEmailParams({ ...booking, kind: 'contact', mentor: undefined, plan: undefined, slot: undefined }, 'o@x.com')
    expect(p.subject).toBe('New contact message: Asha Rao')
    expect(p.message).not.toContain('Mentor')
  })
  it('never throws when sending fails', async () => {
    const send = vi.fn().mockRejectedValue(new Error('network'))
    await expect(notifyOwner(booking, send, 'o@x.com')).resolves.toBe(false)
  })
  it('skips sending when owner email is blank', async () => {
    const send = vi.fn()
    expect(await notifyOwner(booking, send, '')).toBe(false)
    expect(send).not.toHaveBeenCalled()
  })
  it('returns true when sent', async () => {
    const send = vi.fn().mockResolvedValue(undefined)
    expect(await notifyOwner(booking, send, 'owner@example.com')).toBe(true)
  })
})
```

- [ ] **Step 2:** `npx vitest run src/lib/notify.test.ts` → FAIL (module not found).
- [ ] **Step 3: `src/lib/notify.ts`**

```ts
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
```

- [ ] **Step 4:** `npx vitest run src/lib/notify.test.ts` → PASS. Commit `feat: owner notification emails (emailjs)`.
- [ ] **Step 5 (docs for the owner):** append to `career-boost-hub/README.md` an "EmailJS setup" note: create a service and a template whose fields use `{{to_email}}`, `{{reply_to}}`, `{{subject}}`, `{{message}}`, then fill the four env vars.

### Task 9: Contact form → leads + email

**Files:** modify `src/components/clone/Contact.tsx`

- [ ] **Step 1:** On valid submit (existing schema), guard double submits (`if (busy) return`, button disabled while busy), insert into `leads` (`name, email, phone, goals`) when `supabase` exists, then `await notifyOwner({ kind: 'contact', name, email, phone, requirements: goals })`. Show the live site's success toast whether or not the email sent; if the leads insert errors, show an error toast and keep the form content.
- [ ] **Step 2:** `npm run build && npm test`. Commit `feat: contact form saves lead and emails owner`.

### Task 10: Slots logic (test-first), mentors, booking, mock payment

**Files:** create `src/lib/slots.ts`, `src/lib/slots.test.ts`, `src/pages/{Mentors,MentorProfile,Book}.tsx`, `supabase/seed.sql`; modify `Payment.tsx`, `App.tsx`

**Interfaces:** Produces `generateSlots(from: Date, days: number, taken: string[]): string[]` (ISO strings, 10:00–17:00 IST hourly, Mon–Sat, excluding `taken` and the past).

- [ ] **Step 1: `slots.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { generateSlots } from './slots'

const from = new Date('2026-11-02T00:00:00+05:30') // Monday 00:00 IST
describe('generateSlots', () => {
  it('gives hourly 10:00-17:00 IST slots, Mon-Sat only', () => {
    const s = generateSlots(from, 7, [])
    expect(s).toContain('2026-11-02T04:30:00.000Z') // 10:00 IST Monday
    expect(s.length).toBe(6 * 8) // Sunday skipped
    expect(s.some(x => x.startsWith('2026-11-08'))).toBe(false) // Sunday 2026-11-08 IST
  })
  it('removes taken slots', () => {
    const s = generateSlots(from, 1, ['2026-11-02T04:30:00.000Z'])
    expect(s).not.toContain('2026-11-02T04:30:00.000Z')
  })
  it('drops slots already in the past', () => {
    const now = new Date('2026-11-02T08:00:00Z')
    expect(generateSlots(now, 1, []).every(x => new Date(x) > now)).toBe(true)
  })
})
```

- [ ] **Step 2:** `npx vitest run src/lib/slots.test.ts` → FAIL. Then implement `src/lib/slots.ts`:

```ts
const IST_OFFSET_MIN = 330

// ponytail: fixed 10:00-17:00 IST grid; per-mentor availability tables if mentors need custom hours
export function generateSlots(from: Date, days: number, taken: string[]): string[] {
  const out: string[] = []
  const takenSet = new Set(taken)
  const startIst = new Date(from.getTime() + IST_OFFSET_MIN * 60000)
  const dayStartUtc = Date.UTC(startIst.getUTCFullYear(), startIst.getUTCMonth(), startIst.getUTCDate())
  for (let d = 0; d < days; d++) {
    const dayMs = dayStartUtc + d * 86400000
    if (new Date(dayMs).getUTCDay() === 0) continue // Sunday (IST calendar date)
    for (let h = 10; h < 18; h++) {
      const iso = new Date(dayMs + h * 3600000 - IST_OFFSET_MIN * 60000).toISOString()
      if (new Date(iso) > from && !takenSet.has(iso)) out.push(iso)
    }
  }
  return out
}
```

- [ ] **Step 3:** `npx vitest run src/lib/slots.test.ts` → PASS.
- [ ] **Step 4: Pages (contracts).** `Mentors` lists `mentors` as cards using the clone's card classes (photo/initials, name, title @ company, skills badges, rate, "View profile"). `MentorProfile` shows bio and a "Book a session" link to `/book/:mentorId`. `Book` (ProtectedRoute) has a plan selector (Basic/Standard/Premium with the exact prices), a slot picker from `generateSlots(new Date(), 14, taken)` where `taken` comes from the `taken_slots(mentor)` RPC, a **Phone** input, a **Requirements** textarea (required, ≥ 10 chars), and "Continue to payment" which navigates to `/payment` with router state `{ mentorId, plan, amount, startsAt, requirements, phone }`.
- [ ] **Step 5: Payment (mock).** `Payment.onPay` in mock mode: insert the `sessions` row (`status='booked'`, requirements) → on unique violation toast "That slot was just taken" and go back; insert `payments` (`mode='mock'`, `reference='MOCK-'+crypto.randomUUID().slice(0,8)`, `amount_inr`), update `sessions.payment_id`, then call `notifyOwner({ kind:'booking', name: profile.full_name, email: user.email, phone, requirements, mentor: mentor.name, plan, slot })`, toast success, navigate to `/dashboard`. Show a visible "Demo payment: no money is charged" banner whenever `paymentMode==='mock'`. Opening `/payment` with no router state shows the original static page.
- [ ] **Step 6:** `supabase/seed.sql` inserts 4 sample mentors (names/companies from the testimonials). Build, test, commit `feat: mentors, booking, mock payment, owner email on booking`.

### Task 11: Student dashboard

**Files:** create `src/pages/Dashboard.tsx`

- [ ] **Step 1:** Contract: ProtectedRoute page with three cards. **Mentorship sessions** (join `mentors`; Upcoming vs Past; a cancel button sets `status='cancelled'`), **Growth roadmap** (list of `roadmap_items` as a checklist; toggling updates `done`; add-item input; when empty offer "Generate starter roadmap" inserting 5 items), **Interview-prep milestones** (vertical timeline of `milestones` with due dates and done toggles; add-milestone form). Empty states in the clone's muted-foreground style. No Supabase → `<ConnectSupabase />`.
- [ ] **Step 2:** Build; commit `feat: student dashboard`.

### Task 12: Admin panel

**Files:** create `src/pages/Admin.tsx`

- [ ] **Step 1:** `<ProtectedRoute role="admin">`; tabs **Bookings** (all `sessions` joined to mentor + student name, showing requirements and status; mark completed/cancelled), **Leads** (all `leads`, newest first, CSV export button), **Mentors** (table with create/edit/delete form on `mentors`). Build; commit `feat: admin panel`.

### Task 13: ATS checker (test-first)

**Files:** create `src/lib/ats.ts`, `src/lib/ats.test.ts`, `src/pages/AtsChecker.tsx`; install `pdfjs-dist mammoth`

**Interfaces:** Produces `scoreResume(resume: string, jd: string): AtsResult` where `AtsResult = { score: number; matched: string[]; missing: string[]; sections: Record<'contact'|'summary'|'experience'|'education'|'skills', boolean>; warnings: string[] }`.

- [ ] **Step 1: `ats.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { scoreResume } from './ats'

const resume = `Asha Rao asha@example.com +91 98765 43210
Summary: Data analyst with Python and SQL experience.
Experience: Built dashboards in Tableau and Python pipelines at Acme.
Education: B.Tech Computer Science
Skills: Python, SQL, Tableau, Excel`
const jd = 'We need a data analyst skilled in Python, SQL, Tableau and machine learning.'

describe('scoreResume', () => {
  it('matches keywords and flags the missing one', () => {
    const r = scoreResume(resume, jd)
    expect(r.matched).toEqual(expect.arrayContaining(['python', 'sql', 'tableau']))
    expect(r.missing).toContain('machine')
    expect(r.score).toBeGreaterThan(50)
  })
  it('detects all five sections', () => {
    expect(Object.values(scoreResume(resume, jd).sections).every(Boolean)).toBe(true)
  })
  it('empty resume scores 0 without throwing', () => {
    expect(scoreResume('', jd).score).toBe(0)
  })
  it('empty jd or only stop-words does not throw', () => {
    expect(() => scoreResume(resume, '')).not.toThrow()
    expect(() => scoreResume(resume, 'the and of to')).not.toThrow()
    expect(scoreResume(resume, '').missing).toEqual([])
  })
  it('a missing contact block is reported', () => {
    const r = scoreResume('Experience: worked. Skills: Python', jd)
    expect(r.sections.contact).toBe(false)
    expect(r.warnings.join(' ')).toMatch(/contact/i)
  })
})
```

- [ ] **Step 2:** `npx vitest run src/lib/ats.test.ts` → FAIL. Then implement `src/lib/ats.ts`:

```ts
const STOP = new Set('a an the and or of to in for with on at by from as is are be we you our your will can need needs looking skilled experience required strong good ability work team etc'.split(' '))

export type AtsResult = {
  score: number; matched: string[]; missing: string[]
  sections: Record<'contact' | 'summary' | 'experience' | 'education' | 'skills', boolean>
  warnings: string[]
}

const tokens = (t: string) => (t.toLowerCase().match(/[a-z][a-z+#.]{1,}/g) ?? []).map(w => w.replace(/\.+$/, ''))

// ponytail: single-word keywords by frequency; phrase/synonym matching if scores feel too literal
export function scoreResume(resume: string, jd: string): AtsResult {
  const text = resume.trim()
  const have = new Set(tokens(text))
  const freq = new Map<string, number>()
  for (const w of tokens(jd)) if (w.length > 2 && !STOP.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1)
  const kws = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([w]) => w)
  const matched = kws.filter(k => have.has(k))
  const missing = kws.filter(k => !have.has(k))

  const sections = {
    contact: /\S+@\S+\.\S+/.test(text) && /\+?\d[\d\s-]{8,}/.test(text),
    summary: /\b(summary|objective|profile)\b/i.test(text),
    experience: /\b(experience|employment|internship)\b/i.test(text),
    education: /\b(education|b\.?tech|bachelor|master|degree)\b/i.test(text),
    skills: /\bskills?\b/i.test(text),
  }
  const warnings: string[] = []
  if (!sections.contact) warnings.push('Add a contact block with email and phone.')
  for (const [k, ok] of Object.entries(sections)) if (!ok && k !== 'contact') warnings.push(`Add a clear "${k}" section heading.`)
  const words = text ? text.split(/\s+/).length : 0
  if (words > 0 && words < 150) warnings.push('Resume looks very short.')
  if (words > 1200) warnings.push('Resume is long; aim for 1-2 pages.')

  if (!text) return { score: 0, matched: [], missing: kws, sections, warnings: ['Resume text is empty.'] }
  const kwScore = kws.length ? matched.length / kws.length : 1
  const secScore = Object.values(sections).filter(Boolean).length / 5
  const score = Math.round((kwScore * 0.6 + secScore * 0.4) * 100)
  return { score, matched, missing, sections, warnings }
}
```

- [ ] **Step 3:** `npx vitest run src/lib/ats.test.ts` → PASS (adjust only the implementation, not the tests, if a case fails).
- [ ] **Step 4: Page contract:** two columns: left, a file input (`.pdf,.docx,.txt`) plus a textarea for pasting resume text, and a textarea for the job description; PDF text via `pdfjs-dist` (`getDocument` → `getTextContent`), DOCX via `mammoth.extractRawText`; right, a result card with a circular score (primary color), matched chips (accent), missing chips (destructive), a section checklist, and a warnings list. Parse errors toast "Couldn't read that file; paste the text instead".
- [ ] **Step 5:** Build, commit `feat: ATS checker`.

### Task 14: Resume builder

**Files:** create `src/pages/ResumeBuilder.tsx`, `src/components/ResumePreview.tsx`, `src/styles/print.css`

- [ ] **Step 1:** Contract: state shape `{ personal:{name,email,phone,location,links}, summary, experience:[{role,company,from,to,bullets}], education:[{degree,school,year}], skills:string[], projects:[{name,detail}] }`. Left: accordion sections with add/remove rows; right: `ResumePreview` (A4-ratio sheet) with a template switch (Classic single-column, Modern two-column with accent sidebar). "Download PDF" calls `window.print()` with `print.css` hiding everything except the sheet (`@media print`, `@page { size: A4; margin: 12mm }`). Empty arrays render no heading or blank space. Signed-in users get auto-save (debounced 800ms upsert into `resumes.data`) and load on mount; signed-out users get a `localStorage` fallback.
- [ ] **Step 2:** Add nav links for ATS Checker and Resume Builder under a "Tools" item in the account menu and in the footer (desktop and mobile). Build, commit `feat: resume builder`.

### Task 15: Final verification

- [ ] **Step 1:** `npm test && npm run build && node scripts/shotdiff.mjs` all pass.
- [ ] **Step 2:** Browser walkthrough of every route at 1280 and 375 (no Supabase keys): home, `/payment`, `/xyz` (404), `/login`, `/signup`, `/mentors`, `/dashboard` (redirects to login), `/ats-checker` (works fully), `/resume-builder` (works fully, print preview OK). Report anything needing the owner's keys.
- [ ] **Step 3:** Write the `career-boost-hub/README.md` run/setup section (npm i, `.env`, run migration + seed, EmailJS, how to make yourself admin: `update profiles set role='admin' where id = '<your uid>'`). Commit `docs: setup guide`.
