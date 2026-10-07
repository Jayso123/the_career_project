# Career Boost Hub v2: Exact Clone + Full Feature Set

**Supersedes** `2026-10-06-landing-page-design.md` (an approximate build; its plan is retired).

## Purpose
One version of the project that (a) reproduces https://careerboostmentor.lovable.app/ at near-pixel accuracy and (b) adds the requested features: auth + Login button, student dashboard, mentor profiles, session booking with mock payment, admin panel, ATS checker, resume builder.

## Part A: Exact clone

### Source of truth
The live site's own assets, saved in `.superpowers/ref/` (not shipped): `index.html`, `site.css` (77 KB compiled Tailwind v3), `site.js` (minified React bundle), `hero-bg.jpg`. Markup, copy, class names and icons are extracted from `site.js`, not guessed.

### Facts found in the bundle
- Fonts: **Inter** (body) and **Plus Jakarta Sans** (headings).
- shadcn/ui HSL tokens, light: background `210 25% 98%`, foreground `215 35% 15%`, primary `215 65% 18%`, accent `175 65% 40%`, secondary `210 20% 94%`, muted `210 15% 92%`, border `210 20% 88%`, radius `.75rem`. A dark-mode set exists too (primary `175 65% 45%`).
- Animation: framer-motion (`whileInView`, `once: true`) and GSAP + ScrollTrigger.
- Routes: `/`, `/payment`, `*` (not found).
- Hero image `hero-bg.jpg`. Metadata/SEO tags from `index.html` are kept (title, description, OG, Twitter).
- Stats and other cards use lucide icons.

### Stack change (vs the retired plan)
Tailwind **v3** + shadcn/ui token setup + `tailwindcss-animate`, react-router, framer-motion, gsap, lucide-react. The `tailwind.config` and `index.css` are reconstructed from `site.css` (colors, fonts, keyframes, radius). The Tailwind v4 setup and the five sections built so far are replaced.

### Accuracy criterion (99.99% is measured, not claimed)
A script screenshots the live site and the local build at 1280px and 375px, after animations settle, per section, and reports the differing-pixel percentage. Target: under 0.5% per section; the remaining difference is font anti-aliasing and the Lovable badge, which is not copied. Any section over target is fixed before moving on.

### Deliberate differences
- **Login button**: added to the left of "Book Session" in the navbar (desktop and mobile menu). When signed in it becomes an account menu (Dashboard, Log out).
- The Lovable badge and `/~flock.js` are not copied.
- Phone, email and WhatsApp values are taken from the live site as-is.

## Part B: Features

### Backend: Supabase
`@supabase/supabase-js`, email/password auth. Keys come from `career-boost-hub/.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; `.env` is gitignored, `.env.example` is committed). A migration in `supabase/migrations/0001_init.sql` creates the tables below with row-level security; **the user runs it in their Supabase project**. With empty keys the clone part works fully and feature pages show a "Connect Supabase" notice rather than crashing.

### Data model
- `profiles(id → auth.users, full_name, role: student | mentor | admin)`
- `mentors(id, profile_id, name, title, company, bio, skills[], rate_inr, photo_url)`
- `sessions(id, student_id, mentor_id, starts_at, plan, status: booked | completed | cancelled, payment_id)`
- `payments(id, session_id, amount_inr, mode: mock | razorpay, status, reference)`
- `roadmap_items(id, student_id, title, detail, due_on, done)`
- `milestones(id, student_id, title, kind: interview_prep, due_on, done)`
- `resumes(id, student_id, data jsonb, updated_at)`
- `leads(id, name, email, phone, goals, created_at)`: the contact form now writes here (anon insert only)

RLS: students read and write their own rows; mentors read their own sessions; admins read all; `leads` insert is public, select is admin only.

### Pages
| Route | What it does |
|---|---|
| `/login`, `/signup` | Email/password; redirect to `/dashboard` |
| `/dashboard` | Student dashboard: upcoming/past **mentorship sessions**, **personalized growth roadmap** (checklist), **interview-prep milestones** (timeline); empty states |
| `/mentors`, `/mentors/:id` | Mentor listing and profile pages |
| `/book/:mentorId` | Choose plan (Basic ₹299, Standard ₹699, Premium ₹1,199) and a time slot, then go to payment |
| `/payment` | The clone's payment page. With `VITE_PAYMENT_MODE=mock` it records a `payments` row marked paid with a `MOCK-…` reference and confirms the booking. Razorpay is a later swap behind the same env switch |
| `/admin` | Admin only: bookings, leads, mentor create/edit |
| `/ats-checker` | Upload PDF/DOCX/paste text plus a job description; returns an ATS score with matched/missing keywords, section checks (contact, summary, experience, education, skills), and format warnings. Pure in-browser logic (pdfjs-dist, mammoth), no server |
| `/resume-builder` | Form sections (personal, summary, experience, education, skills, projects), live preview, 2 templates, PDF via the browser's print dialog; signed-in users save to `resumes` |

### Booking notification email (added after review)
Whenever someone books a session (the `/book` flow after payment is recorded) **or** submits the contact form, the owner receives an email containing: the user's name, email, phone, the chosen mentor/plan/time slot (bookings only), and their requirements (the "Career Goals" text, or a requirements box added to the booking form). Sent with **EmailJS** from the browser: no server needed; keys in `.env` as `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`, and the recipient in `VITE_OWNER_EMAIL`, all left blank for the owner to fill in. The database row is the source of truth; a failed email shows no error to the student and is logged to the console, and the booking still succeeds. Known ceiling: EmailJS public keys are visible in the browser, so spam is limited by EmailJS's own domain allow-list and quota; a Supabase Edge Function + Resend is the upgrade path.

### Not in this version
AI-written ATS feedback (needs a server-side key), real Razorpay charges, SMS notifications, mentor-side dashboard UI beyond viewing their sessions.

## Build order
1. Exact clone of `/` + `/payment` + NotFound, with screenshot-diff script
2. Supabase client, env, migration, auth, Login button, protected routes
3. Contact form writes to `leads`
4. Mentors + booking + mock payment
5. Student dashboard
6. Admin
7. ATS checker (pure logic, test-first)
8. Resume builder

## Testing
Vitest for pure logic (ATS scorer, contact schema, booking slot logic); the screenshot-diff script for the clone; browser walkthrough of each route. Feature flows that need Supabase can only be verified end to end once the user supplies keys and runs the migration.
