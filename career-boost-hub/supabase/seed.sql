-- Run after 0001_init.sql and 0002_session_guard.sql. Safe to re-run (needs the mentors_name_key index from 0002).
insert into mentors (name, title, bio, company, skills) values
  ('Priya Sharma',  'Tech & IT Careers',           '8+ years of experience in Tech & IT Careers',           '', '{}'),
  ('Rahul Verma',   'Business & Finance',          '10+ years of experience in Business & Finance',         '', '{}'),
  ('Ananya Gupta',  'Healthcare & Medicine',       '12+ years of experience in Healthcare & Medicine',      '', '{}'),
  ('Vikram Singh',  'Creative Industries',         '7+ years of experience in Creative Industries',         '', '{}'),
  ('Sneha Patel',   'Engineering & Manufacturing', '9+ years of experience in Engineering & Manufacturing', '', '{}')
on conflict do nothing;
