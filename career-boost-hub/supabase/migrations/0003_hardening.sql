-- Run after 0002_session_guard.sql. Idempotent: safe to run more than once.

-- Stable ordering for rows that share a due date.
alter table public.roadmap_items add column if not exists created_at timestamptz not null default now();
alter table public.milestones    add column if not exists created_at timestamptz not null default now();

-- leads email format check (phone is free text and optional on the contact form, so it is NOT format-checked; 0001 keeps its length cap).
-- Rationale: the form uses type=email and realistic addresses never contain ? & # % or CR/LF; rejecting them protects the admin mailto link.
-- NOT VALID: enforced for new/updated rows, existing rows are not scanned or rejected.
-- (To enforce on old rows too, after cleaning them: alter table public.leads validate constraint <name>;)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_email_format' and conrelid = 'public.leads'::regclass) then
    alter table public.leads add constraint leads_email_format
      check (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' and email !~ '[?&#%\r\n]') not valid;
  end if;
end $$;
