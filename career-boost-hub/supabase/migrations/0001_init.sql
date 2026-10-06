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

-- booked slots are exposed only as times (students cannot read other students' sessions)
create function taken_slots(p_mentor uuid) returns setof timestamptz
language sql security definer stable as
$$ select starts_at from sessions where mentor_id = p_mentor and status <> 'cancelled' and starts_at > now() $$;
grant execute on function taken_slots(uuid) to anon, authenticated;
