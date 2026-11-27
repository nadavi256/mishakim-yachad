-- Helpers, RLS, and the onboarding RPC. auth.uid() is wrapped in a scalar
-- subquery so Postgres can cache it per statement.

create or replace function private.is_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function private.can_access_chat(p_activity text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  -- Organizer, or a participant whose request was approved.
  -- Pending, rejected, and cancelled users fail this check.
  -- There is no other conversation type, so a minor and an adult can message
  -- each other only when both pass this check for the same activity.
  select (select auth.uid()) is not null
    and (
      exists (
        select 1
        from public.activities activity
        where activity.id = p_activity
          and activity.owner_id = (select auth.uid())
      )
      or exists (
        select 1
        from public.participants participant
        where participant.activity_id = p_activity
          and participant.user_id = (select auth.uid())
          and participant.status in ('approved', 'needs_reconfirm')
      )
    );
$$;

revoke all on function private.is_blocked(uuid, uuid) from public, anon;
revoke all on function private.can_access_chat(text) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_blocked(uuid, uuid) to authenticated;
grant execute on function private.can_access_chat(text) to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name, visibility, is_minor, onboarding_complete)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', 'משתמש חדש'),
    'private',
    true,
    false
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Birth date is required here. is_minor is computed from it (under 18).
-- Under 16 must pass the parent-approval stub before the row is stored.
create or replace function public.complete_onboarding(
  p_birth_date date,
  p_parent_approved boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  minor boolean;
  under16 boolean;
begin
  if uid is null then
    raise exception 'sign-in required';
  end if;
  if p_birth_date is null
     or p_birth_date > current_date
     or p_birth_date <= current_date - interval '120 years' then
    raise exception 'invalid birth date';
  end if;
  minor := p_birth_date > (current_date - interval '18 years');
  under16 := p_birth_date > (current_date - interval '16 years');
  if under16 and coalesce(p_parent_approved, false) is not true then
    raise exception 'parent approval required';
  end if;

  insert into public.profiles (user_id)
  values (uid)
  on conflict (user_id) do nothing;

  insert into private.user_private (user_id, birth_date)
  values (uid, p_birth_date)
  on conflict (user_id) do update
    set birth_date = excluded.birth_date,
        updated_at = now();

  update public.profiles
  set is_minor = minor,
      onboarding_complete = true,
      updated_at = now()
  where user_id = uid;

  if under16 then
    insert into public.parent_consents (minor_user_id, approved, method)
    values (uid, true, 'checkbox_stub');
  end if;
end;
$$;

revoke all on function public.complete_onboarding(date, boolean) from public, anon;
grant execute on function public.complete_onboarding(date, boolean) to authenticated;

-- Join never lets the client write status = approved on an approval activity.
create or replace function public.join_activity(p_activity text, p_message text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  activity public.activities%rowtype;
  approved_count int;
  next_status text;
begin
  if uid is null then
    raise exception 'sign-in required';
  end if;
  select * into activity from public.activities where id = p_activity for update;
  if activity.id is null or activity.status <> 'published' then
    raise exception 'activity unavailable';
  end if;
  if activity.owner_id = uid then
    raise exception 'organizer cannot join as a participant';
  end if;
  if private.is_blocked(uid, activity.owner_id) then
    raise exception 'blocked';
  end if;
  if activity.starts_at <= now() then
    raise exception 'activity already started';
  end if;

  if activity.join_policy = 'immediate' then
    select count(*) into approved_count
    from public.participants
    where activity_id = activity.id
      and status in ('approved', 'needs_reconfirm');
    if activity.capacity is not null and approved_count >= activity.capacity then
      raise exception 'activity full';
    end if;
    next_status := 'approved';
  else
    next_status := 'pending';
  end if;

  insert into public.participants (id, activity_id, user_id, status, request_message, requested_at, approved_at)
  values (
    'p-' || activity.id || '-' || uid::text,
    activity.id,
    uid,
    next_status,
    p_message,
    now(),
    case when next_status = 'approved' then now() else null end
  )
  on conflict (activity_id, user_id) do update
    set status = excluded.status,
        request_message = excluded.request_message,
        requested_at = excluded.requested_at,
        approved_at = excluded.approved_at,
        updated_at = now()
    where public.participants.status in ('cancelled', 'rejected');

  return next_status;
end;
$$;

revoke all on function public.join_activity(text, text) from public, anon;
grant execute on function public.join_activity(text, text) to authenticated;

create or replace function public.approve_participant(p_participant text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  row public.participants%rowtype;
  activity public.activities%rowtype;
  approved_count int;
begin
  if uid is null then
    raise exception 'sign-in required';
  end if;
  select * into row from public.participants where id = p_participant for update;
  if row.id is null then
    raise exception 'request not found';
  end if;
  select * into activity from public.activities where id = row.activity_id for update;
  if activity.owner_id <> uid then
    raise exception 'organizer only';
  end if;
  if private.is_blocked(uid, row.user_id) then
    raise exception 'blocked';
  end if;
  select count(*) into approved_count
  from public.participants
  where activity_id = activity.id
    and status in ('approved', 'needs_reconfirm');
  if activity.capacity is not null and approved_count >= activity.capacity then
    raise exception 'activity full';
  end if;
  update public.participants
  set status = 'approved',
      approved_at = now(),
      updated_at = now()
  where id = row.id;
end;
$$;

revoke all on function public.approve_participant(text) from public, anon;
grant execute on function public.approve_participant(text) to authenticated;

alter table public.sports enable row level security;
alter table public.sports force row level security;
alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.user_sports enable row level security;
alter table public.user_sports force row level security;
alter table public.activities enable row level security;
alter table public.activities force row level security;
alter table public.meeting_locations enable row level security;
alter table public.meeting_locations force row level security;
alter table public.participants enable row level security;
alter table public.participants force row level security;
alter table public.messages enable row level security;
alter table public.messages force row level security;
alter table public.reports enable row level security;
alter table public.reports force row level security;
alter table public.blocks enable row level security;
alter table public.blocks force row level security;
alter table public.parent_consents enable row level security;
alter table public.parent_consents force row level security;

grant usage on schema public to anon, authenticated;

grant select on public.sports to authenticated;
grant select on public.profile_public to authenticated;
grant select on public.profiles to authenticated;
grant update (
  display_name, bio, general_area, role, role_label, avatar, pronoun, specialty_note, visibility
) on public.profiles to authenticated;

grant select, insert, delete on public.user_sports to authenticated;
grant select, insert, update on public.activities to authenticated;
grant select, insert, update, delete on public.meeting_locations to authenticated;
grant select, insert, update on public.participants to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert on public.reports to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select, insert on public.parent_consents to authenticated;

-- Clients cannot flip is_minor or onboarding_complete. Those columns stay
-- with the table owner and are written only by complete_onboarding.

create policy sports_read on public.sports
  for select to authenticated
  using (true);

create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy profiles_select_public on public.profiles
  for select to authenticated
  using (
    visibility = 'public'
    and not private.is_blocked((select auth.uid()), user_id)
  );

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy user_sports_own on public.user_sports
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy user_sports_public_read on public.user_sports
  for select to authenticated
  using (
    exists (
      select 1
      from public.profiles profile
      where profile.user_id = user_sports.user_id
        and profile.visibility = 'public'
        and not private.is_blocked((select auth.uid()), profile.user_id)
    )
  );

create policy activities_select_own on public.activities
  for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy activities_select_published on public.activities
  for select to authenticated
  using (
    status = 'published'
    and not private.is_blocked((select auth.uid()), owner_id)
  );

create policy activities_insert_own on public.activities
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy activities_update_own on public.activities
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy meeting_select on public.meeting_locations
  for select to authenticated
  using (
    exists (
      select 1
      from public.activities activity
      where activity.id = meeting_locations.activity_id
        and (
          activity.owner_id = (select auth.uid())
          or (
            activity.status = 'published'
            and not private.is_blocked((select auth.uid()), activity.owner_id)
          )
        )
    )
  );

create policy meeting_write_owner on public.meeting_locations
  for all to authenticated
  using (
    exists (
      select 1 from public.activities activity
      where activity.id = meeting_locations.activity_id
        and activity.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.activities activity
      where activity.id = meeting_locations.activity_id
        and activity.owner_id = (select auth.uid())
    )
  );

create policy participants_select_own on public.participants
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy participants_select_organizer on public.participants
  for select to authenticated
  using (
    exists (
      select 1 from public.activities activity
      where activity.id = participants.activity_id
        and activity.owner_id = (select auth.uid())
    )
  );

-- A client insert can only open a pending request. Approval is join_activity / approve_participant.
create policy participants_insert_pending on public.participants
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
  );

create policy participants_cancel_own on public.participants
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and status = 'cancelled'
  );

create policy messages_select on public.messages
  for select to authenticated
  using (
    private.can_access_chat(activity_id)
    and (
      sender_id = (select auth.uid())
      or not private.is_blocked((select auth.uid()), sender_id)
    )
  );

create policy messages_insert on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and private.can_access_chat(activity_id)
    and not private.is_blocked(
      (select auth.uid()),
      (select activity.owner_id from public.activities activity where activity.id = activity_id)
    )
  );

create policy reports_own on public.reports
  for select to authenticated
  using ((select auth.uid()) = reporter_id);

create policy reports_insert_own on public.reports
  for insert to authenticated
  with check ((select auth.uid()) = reporter_id);

create policy blocks_own on public.blocks
  for select to authenticated
  using ((select auth.uid()) = blocker_id);

create policy blocks_insert_own on public.blocks
  for insert to authenticated
  with check ((select auth.uid()) = blocker_id and blocker_id <> blocked_id);

create policy blocks_delete_own on public.blocks
  for delete to authenticated
  using ((select auth.uid()) = blocker_id);

create policy parent_consents_own on public.parent_consents
  for select to authenticated
  using ((select auth.uid()) = minor_user_id);

create policy parent_consents_insert_own on public.parent_consents
  for insert to authenticated
  with check ((select auth.uid()) = minor_user_id and approved = true);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.messages;
    exception
      when duplicate_object then null;
    end;
  end if;
end $$;
