-- Run after 0002_session_guard.sql. Idempotent: safe to run more than once.

-- Stable ordering for rows that share a due date.
alter table public.roadmap_items add column if not exists created_at timestamptz not null default now();
alter table public.milestones    add column if not exists created_at timestamptz not null default now();

-- leads format checks. NOT VALID: enforced for new/updated rows, existing rows are not scanned or rejected.
-- (To enforce on old rows too, after cleaning them: alter table public.leads validate constraint <name>;)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_email_format' and conrelid = 'public.leads'::regclass) then
    alter table public.leads add constraint leads_email_format
      check (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' and email !~ '[?&#%\r\n]') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'leads_phone_format' and conrelid = 'public.leads'::regclass) then
    alter table public.leads add constraint leads_phone_format
      check (phone ~ '^[0-9+()\s\-]{0,40}$') not valid;
  end if;
end $$;
