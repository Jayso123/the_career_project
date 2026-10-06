# Career Boost Hub: Landing Page (Sub-project 1)

## Purpose
Recreate https://careerboostmentor.lovable.app/ as a local project we own, as the base for later sub-projects (Supabase auth, dashboard, booking and payments, admin, ATS checker, resume builder).

## Stack
Vite, React, TypeScript, Tailwind CSS, shadcn/ui, lucide-react, react-router (installed now, used from sub-project 2). Same stack Lovable generates, so structure maps 1:1. Lives in `final year/career-boost-hub/`.

## Scope (this sub-project only)
A single page with smooth-scroll anchors, in this order:
1. **Navbar**: logo, Home / Services / Pricing / Testimonials / Contact, "Book Session" CTA (scrolls to Contact for now). Mobile hamburger.
2. **Hero**: headline about transforming careers with expert mentorship, two CTAs, background image.
3. **Stats banner**: 5000+ Students Guided, 98% Success Rate, 200+ Career Transitions.
4. **Why Choose Us**: Personalized Approach, Fast Track Growth, Goal Oriented, Real Results.
5. **Services (6)**: career counseling, skill roadmaps, resume review, interview prep, industry insights, higher education guidance.
6. **Career Paths (6)**: Software Engineering, Data Science, UX/UI Design, Product Management, Digital Marketing, Cybersecurity, each with top company names.
7. **Pricing (3)**: Basic ₹299/session, Standard ₹699/session ("Most Popular"), Premium ₹1,199/month.
8. **Testimonials (4)**: professionals at Google, Microsoft, Amazon, Flipkart.
9. **Contact**: email, phone and WhatsApp CTAs, plus a form (Full Name, Email, Phone, Career Goals, "Send Message", "No spam, ever").
10. **Footer**: links, services list, contact info, copyright, Privacy/Terms stubs.

## Design
Modern SaaS look with blue and teal accents. The tokens live as CSS variables in `index.css`, so they are easy to retune. Responsive at phone width.

## Known limits
- Only page text was available to me, so exact copy beyond the items above, plus exact colors, spacing, and images, are close approximations. Send screenshots or let me view the live site in the browser to tighten the match.
- The testimonial photos and hero image are placeholders (stock or generated), not the originals.
- Phone, email and WhatsApp values are placeholders until you give real ones.

## Contact form (this sub-project)
Client-side validation (zod) only. On submit it shows a success toast and does not persist. Sub-project 2 wires it to a Supabase `leads` table.

## Structure
One component per section in `src/components/`, content arrays in `src/data/content.ts`, assembled in `src/pages/Index.tsx`. Components stay small and stateless apart from the navbar toggle and the form.

## Testing
`npm run build` and `tsc` pass. Manual check at desktop and 375px widths. One Vitest test covers form validation (empty, bad email, valid).

## Out of scope
Auth, backend, payments, dashboard, admin, resume tools, SEO and analytics. These come in later sub-projects.
