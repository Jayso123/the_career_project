-- Run after 0001_init.sql. Safe to run once.

-- Mentor names are the join key between the site's hard-coded mentor list and the mentors table.
create unique index mentors_name_key on mentors (name);

-- payments.status was unconstrained
alter table payments add constraint payments_status_check check (status in ('paid','failed','refunded'));

-- Students may update their own sessions (e.g. cancel) but not move them or re-point payments.
create function public.guard_session_update() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if not public.is_admin() and (
    new.mentor_id <> old.mentor_id
    or new.starts_at <> old.starts_at
    or new.student_id <> old.student_id
    or (old.payment_id is not null and new.payment_id is distinct from old.payment_id)
  ) then
    raise exception 'sessions.mentor_id, starts_at, student_id and an existing payment_id are locked';
  end if;
  return new;
end $$;

create trigger sessions_guard_update before update on sessions
for each row execute function public.guard_session_update();
