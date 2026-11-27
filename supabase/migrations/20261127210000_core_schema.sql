-- M2 core schema. Teens are allowed. There is no 18+ gate.
-- Phone, home address, birth date, and a person's precise coordinates live in
-- private.user_private and are never selected by a public view.
-- A minor's profile exposes general_area (city/region) only.
-- There is no direct-message table. Chat exists only on an activity, and only
-- the organizer and approved participants can use it. That is what stops a
-- private chat between a minor and an adult who are not both approved on the
-- same activity.

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to postgres, service_role;

create table public.sports (
  id text primary key,
  name_he text not null,
  sort_order int not null default 0
);

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'משתמש חדש' check (char_length(display_name) between 1 and 80),
  bio text not null default '' check (char_length(bio) <= 500),
  general_area text not null default '' check (char_length(general_area) <= 80),
  role text not null default 'participant' check (role in ('participant', 'coach')),
  role_label text not null default '',
  avatar text,
  pronoun text not null default 'm' check (pronoun in ('m', 'f')),
  specialty_note text,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  -- Copied from private.user_private by complete_onboarding. Defaults to true
  -- so a new account is treated as a minor until a birth date is saved.
  is_minor boolean not null default true,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.user_private (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  birth_date date not null,
  phone text,
  home_address text,
  precise_lat double precision,
  precise_lon double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_private_birth_date_sane check (
    birth_date <= current_date
    and birth_date > current_date - interval '120 years'
  )
);

alter table private.user_private enable row level security;
alter table private.user_private force row level security;
revoke all on table private.user_private from public, anon, authenticated;

create table public.user_sports (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  sport_id text not null references public.sports (id),
  level text not null default 'all' check (level in ('all', 'beginner', 'intermediate', 'advanced')),
  primary key (user_id, sport_id)
);

create table public.activities (
  id text primary key,
  owner_id uuid not null references public.profiles (user_id),
  sport_id text not null references public.sports (id),
  title text not null check (char_length(title) between 3 and 100),
  subtitle text not null default '',
  description text not null default '' check (char_length(description) <= 2000),
  level text not null default 'all' check (level in ('all', 'beginner', 'intermediate', 'advanced')),
  starts_at timestamptz not null,
  timezone text not null default 'Asia/Jerusalem',
  duration_minutes int check (duration_minutes is null or duration_minutes > 0),
  capacity int check (capacity is null or capacity > 0),
  cost_amount numeric(10, 2) not null default 0 check (cost_amount >= 0),
  currency text not null default 'ILS',
  payment_note text not null default '',
  join_policy text not null default 'immediate' check (join_policy in ('immediate', 'approval')),
  status text not null default 'published' check (status in ('draft', 'published', 'cancelled', 'completed', 'suspended')),
  version int not null default 1,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Meeting point the organizer chose to publish. Not a home address.
create table public.meeting_locations (
  activity_id text primary key references public.activities (id) on delete cascade,
  place_name text not null,
  address text not null default '',
  city text not null default '',
  lat double precision not null,
  lon double precision not null,
  meeting_note text not null default '' check (char_length(meeting_note) <= 500)
);

create table public.participants (
  id text primary key,
  activity_id text not null references public.activities (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  status text not null check (status in ('pending', 'approved', 'rejected', 'cancelled', 'needs_reconfirm')),
  request_message text,
  requested_at timestamptz,
  approved_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, user_id)
);

create table public.messages (
  id text primary key,
  activity_id text not null references public.activities (id) on delete cascade,
  sender_id uuid not null references public.profiles (user_id),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  constraint messages_are_activity_chat check (activity_id is not null)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (user_id),
  subject_type text not null check (subject_type in ('profile', 'activity', 'message')),
  subject_id text not null,
  reason text not null check (char_length(reason) between 1 and 200),
  details text not null default '',
  created_at timestamptz not null default now()
);

create table public.blocks (
  blocker_id uuid not null references public.profiles (user_id) on delete cascade,
  blocked_id uuid not null references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- Under 16. The checkbox in the app is a stub until a real guardian flow exists.
create table public.parent_consents (
  id uuid primary key default gen_random_uuid(),
  minor_user_id uuid not null references public.profiles (user_id) on delete cascade,
  approved boolean not null,
  method text not null default 'checkbox_stub',
  created_at timestamptz not null default now()
);

create index activities_feed_idx on public.activities (sport_id, starts_at) where status = 'published';
create index activities_owner_idx on public.activities (owner_id, status);
create index participants_user_idx on public.participants (user_id, status);
create index participants_activity_idx on public.participants (activity_id, status);
create index messages_activity_idx on public.messages (activity_id, created_at);
create index blocks_blocked_idx on public.blocks (blocked_id, blocker_id);
create index reports_reporter_idx on public.reports (reporter_id, created_at desc);

-- Safe columns only. security_invoker so the caller's RLS still applies.
create view public.profile_public
with (security_invoker = true) as
select
  user_id,
  display_name,
  bio,
  general_area,
  role,
  role_label,
  avatar,
  pronoun,
  specialty_note,
  is_minor
from public.profiles
where visibility = 'public';

comment on view public.profile_public is
  'Public profile. No birth date, phone, home address, or precise coordinates. general_area is a city or region.';

insert into public.sports (id, name_he, sort_order) values
  ('soccer', 'כדורגל', 1),
  ('basketball', 'כדורסל', 2),
  ('volleyball', 'כדורעף', 3),
  ('tennis', 'טניס', 4),
  ('walking', 'הליכה', 5),
  ('running', 'ריצה', 6),
  ('swimming', 'שחייה', 7),
  ('cycling', 'רכיבה', 8),
  ('yoga', 'יוגה', 9),
  ('fitness', 'כושר', 10),
  ('padel', 'פאדל', 11),
  ('table-tennis', 'טניס שולחן', 12),
  ('climbing', 'טיפוס', 13),
  ('pilates', 'פילאטיס', 14)
on conflict (id) do nothing;
