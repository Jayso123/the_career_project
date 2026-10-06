# Career Boost Hub

Career mentorship site for students: an exact clone of the original landing page (hero, career paths, journey, pricing, testimonials, contact), extended with accounts, a mock-payment booking flow that emails the owner, a mentor directory, a student dashboard, an admin console, an ATS resume checker and a resume builder.

## Routes

| Route | What it does |
| --- | --- |
| `/` | Landing page. The Pricing modal (date, time, mentor, plan) is the booking flow and ends on `/payment`. The contact form stores a lead and emails the owner. |
| `/payment` | Booking summary + phone and requirements (both required before Pay). Login required to pay. In mock mode shows a "Demo payment" banner and records the session and payment in Supabase. |
| `/login`, `/signup` | Supabase email/password auth. |
| `/mentors`, `/mentors/:id` | Mentor list and profile (read from Supabase). Book buttons link to `/#pricing`. |
| `/dashboard` | Student only: booked sessions, roadmap, interview-prep milestones. |
| `/admin` | Admin only: bookings, leads (CSV export), mentors. |
| `/ats-checker` | Paste or upload (.txt, .docx, .pdf) a resume and a job description for a keyword + formatting score. Runs fully in the browser. |
| `/resume-builder` | Classic/Modern templates, live preview, Download PDF (browser print), draft saved locally and synced to your account when logged in. |

`/ats-checker` and `/resume-builder` work with no backend. Everything else that stores data needs Supabase (without keys the app still runs and shows "not configured" messages).

## Stack

Vite, React 19, TypeScript, Tailwind CSS, Radix UI, framer-motion + GSAP, react-router, Supabase (auth + Postgres + RLS), EmailJS (owner notifications), mammoth and pdfjs-dist (resume file parsing), vitest.

## Run it

```
npm i
cp .env.example .env     # fill in the values, see below
npm run dev              # http://localhost:5173
npm test                 # unit tests (vitest)
npm run build            # tsc -b && vite build
npm run lint             # oxlint
node scripts/shotdiff.mjs  # pixel diff of the home page vs the live original (dev server must be running)
```

## Environment variables (`.env`)

| Variable | Where to find it |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase dashboard, Project Settings > API > Project URL |
| `VITE_SUPABASE_ANON_KEY` | Same page, `anon` `public` key. Never use the `service_role` key. |
| `VITE_PAYMENT_MODE` | `mock` (default when unset). Real Razorpay is not implemented, see below. |
| `VITE_EMAILJS_SERVICE_ID` | emailjs.com > Email Services > your service ID |
| `VITE_EMAILJS_TEMPLATE_ID` | emailjs.com > Email Templates > your template ID |
| `VITE_EMAILJS_PUBLIC_KEY` | emailjs.com > Account > General > Public Key |
| `VITE_OWNER_EMAIL` | Your inbox: where booking and contact notifications are sent |

Restart `npm run dev` after editing `.env`. Do not commit `.env`.

## Supabase setup

1. Create a project, copy the URL and anon key into `.env`.
2. In the Supabase SQL editor run, in this order: `supabase/migrations/0001_init.sql`, `0002_session_guard.sql`, `0003_hardening.sql`, then `supabase/seed.sql` (the 5 mentors). 0001 and 0002 are run-once; 0003 is idempotent.
3. Sign up in the app, then promote yourself to admin in the SQL editor:
   ```sql
   update public.profiles set role='admin' where id='<your user uid>';
   ```
   (Find the uid under Authentication > Users.) Roles cannot be changed through the API by design.
4. If email confirmation is on, confirm the address before logging in (or turn it off for local testing).

## EmailJS setup

1. Add an email service (e.g. Gmail) and note its Service ID.
2. Create a template with these variables: `{{to_email}}`, `{{reply_to}}`, `{{subject}}`, `{{message}}`. Set the template's **To email** field to `{{to_email}}`, Reply-To to `{{reply_to}}`, Subject to `{{subject}}`, and put `{{message}}` in the body.
3. Put the service ID, template ID and public key in `.env`, and your inbox in `VITE_OWNER_EMAIL`.

An email is sent when a student completes Pay on `/payment` and when the contact form is submitted. Email is best effort: the database row is the source of truth and a failed email never blocks a booking.

## Mock payment, and what must change before real Razorpay

`/payment` currently runs a mock: Pay writes a `sessions` row and a `payments` row (mode `mock`, reference `MOCK-...`) from the browser. This is fine for a demo but not for real money. Before enabling Razorpay:

- Move payment and session creation server-side (an edge function / backend using the service role); the browser must not be able to write payments.
- Tighten or remove the `payments_insert` policy: today a student can insert their own payment with `status='paid'`.
- Validate `sessions.payment_id` against a verified payment belonging to that student (FK/trigger); it is only checked as "set once" today.
- Compute the amount from a trusted server-side plan table, never from client state.

## Known limitations

- Admin lists are not paginated; beyond Supabase's 1000-row response cap, bookings, leads and CSV export would be truncated.
- The EmailJS public key ships in the browser bundle (that is how EmailJS works); restrict the template/domain in the EmailJS dashboard to limit abuse.
- Testimonial photos on the home page load from remote Unsplash URLs, as on the original site.
- `index.html` has no `og:image` / `twitter:image` (the original pointed at lovable.dev). Add your own absolute-URL social image in `index.html`.
- The leads email check (0003) is `NOT VALID`: they apply to new rows only. Phone is free text (length cap only); the admin UI renders only sanitised tel:/mailto: links and the CSV export guards against formulas.
- Dashboard deletes are immediate (no undo); sessions that are in the past but still `booked` are not auto-completed.

## Fidelity note

The landing page is an exact clone of the original, measured section by section with `node scripts/shotdiff.mjs` at 1280px and 375px (pixelmatch threshold 0.1, `includeAA: false` so anti-aliased pixels are not counted, target under 0.5% per section). Each capture is re-taken until it is stable, so animations cannot cause false failures. The only intended visual difference is the navbar **Login** button, which the script hides on the local page.
