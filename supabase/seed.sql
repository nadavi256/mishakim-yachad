-- Sample people and activities, matching the in-app mock (Liron, Daniel, Yossi, Omer, Maya).
-- Liron's published activity is soccer. Daniel's basketball is not Liron's.
-- Omer is under 16 and has a parent-consent stub row. Liron is 17 (minor, no parent row).
-- Phone numbers and home addresses are not inserted.

create extension if not exists pgcrypto with schema extensions;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'liron@example.com', extensions.crypt('demo-not-for-login', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"לירון"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'daniel@example.com', extensions.crypt('demo-not-for-login', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"דניאל לוי"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'yossi@example.com', extensions.crypt('demo-not-for-login', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"יוסי כהן"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'omer@example.com', extensions.crypt('demo-not-for-login', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"עומר הדר"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'maya@example.com', extensions.crypt('demo-not-for-login', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"מאיה ישראלי"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

update public.profiles set
  display_name = data.display_name,
  bio = data.bio,
  general_area = data.general_area,
  role = data.role,
  role_label = data.role_label,
  avatar = data.avatar,
  pronoun = data.pronoun,
  specialty_note = data.specialty_note,
  visibility = 'public',
  is_minor = data.is_minor,
  onboarding_complete = true
from (values
  ('11111111-1111-4111-8111-111111111111'::uuid, 'לירון', 'אוהב ספורט ומחפש שותפים לפעילות', 'קרית אתא', 'participant', 'שותף לספורט', 'liron', 'm', null::text, true),
  ('22222222-2222-4222-8222-222222222222'::uuid, 'דניאל לוי', 'משחק כדורסל וכדורגל בשכונה, שמח לעוד אנשים.', 'קרית אתא', 'participant', 'שותף לספורט', 'daniel', 'm', null::text, false),
  ('33333333-3333-4333-8333-333333333333'::uuid, 'יוסי כהן', 'מאמן כושר. ההתמחות הוזנה על ידי ואין עליה אימות.', 'חיפה והקריות', 'coach', 'מאמן כושר', 'yossi', 'm', 'הסמכה שהוזנה על ידי המאמן. אין תג אימות.', false),
  ('44444444-4444-4444-8444-444444444444'::uuid, 'עומר הדר', 'רץ ורוכב בבוקר, מחפש חברה לקצב קל.', 'קרית ביאליק', 'participant', 'שותף לספורט', 'omer', 'm', null::text, true),
  ('55555555-5555-4555-8555-555555555555'::uuid, 'מאיה ישראלי', 'מאמנת טניס למתחילים. הפרטים המקצועיים הוזנו על ידי.', 'חיפה', 'coach', 'מאמנת טניס', 'maya', 'f', 'הסמכה שהוזנה על ידי המאמנת. אין תג אימות.', false)
) as data(user_id, display_name, bio, general_area, role, role_label, avatar, pronoun, specialty_note, is_minor)
where profiles.user_id = data.user_id;

insert into private.user_private (user_id, birth_date) values
  ('11111111-1111-4111-8111-111111111111', date '2009-05-20'),
  ('22222222-2222-4222-8222-222222222222', date '1998-02-11'),
  ('33333333-3333-4333-8333-333333333333', date '1985-11-02'),
  ('44444444-4444-4444-8444-444444444444', date '2011-09-01'),
  ('55555555-5555-4555-8555-555555555555', date '1992-07-14')
on conflict (user_id) do update set birth_date = excluded.birth_date;

insert into public.parent_consents (minor_user_id, approved, method)
select '44444444-4444-4444-8444-444444444444', true, 'checkbox_stub'
where not exists (
  select 1 from public.parent_consents
  where minor_user_id = '44444444-4444-4444-8444-444444444444'
);

insert into public.user_sports (user_id, sport_id, level) values
  ('11111111-1111-4111-8111-111111111111', 'soccer', 'intermediate'),
  ('11111111-1111-4111-8111-111111111111', 'basketball', 'beginner'),
  ('11111111-1111-4111-8111-111111111111', 'tennis', 'beginner'),
  ('22222222-2222-4222-8222-222222222222', 'basketball', 'intermediate'),
  ('22222222-2222-4222-8222-222222222222', 'soccer', 'beginner'),
  ('33333333-3333-4333-8333-333333333333', 'fitness', 'advanced'),
  ('33333333-3333-4333-8333-333333333333', 'running', 'intermediate'),
  ('44444444-4444-4444-8444-444444444444', 'cycling', 'intermediate'),
  ('44444444-4444-4444-8444-444444444444', 'running', 'beginner'),
  ('55555555-5555-4555-8555-555555555555', 'tennis', 'beginner')
on conflict do nothing;

insert into public.activities (
  id, owner_id, sport_id, title, subtitle, description, level, starts_at, duration_minutes, join_policy, status, published_at
) values
  ('a-soccer', '11111111-1111-4111-8111-111111111111', 'soccer', 'כדורגל בערב', 'משחק שכונתי פתוח', 'משחק כדורגל חברתי במגרש העירוני. הביאו מים ונעליים מתאימות.', 'all', now() + interval '4 hours', 180, 'immediate', 'published', now()),
  ('a-basket', '22222222-2222-4222-8222-222222222222', 'basketball', 'כדורסל בפארק', 'משחק חברתי — כולם מוזמנים', 'נפגשים למשחק כדורסל חברתי. הביאו מים ובגדי ספורט. כדור יהיה במקום.', 'all', now() + interval '1 day', 60, 'immediate', 'published', now()),
  ('a-tennis', '55555555-5555-4555-8555-555555555555', 'tennis', 'טניס למתחילים', 'אימון קליל למי שרק מתחיל', 'מפגש טניס למתחילים. אפשר להשאיל מחבט במקום. הביאו מים.', 'beginner', now() + interval '3 days', 60, 'immediate', 'published', now()),
  ('a-yoga', '33333333-3333-4333-8333-333333333333', 'yoga', 'יוגה בפארק', 'שעה רגועה בחוץ', 'תרגול יוגה לכולם. הביאו מזרן אם יש.', 'all', now() + interval '4 days', 60, 'immediate', 'published', now()),
  ('a-swim', '55555555-5555-4555-8555-555555555555', 'swimming', 'שחייה בבוקר', 'בריכה עירונית', 'שחייה חופשית. כרטיס כניסה לבריכה הוא מחוץ לאפליקציה.', 'all', now() + interval '5 days', 45, 'approval', 'published', now())
on conflict (id) do nothing;

insert into public.meeting_locations (activity_id, place_name, address, city, lat, lon, meeting_note) values
  ('a-soccer', 'מגרש הכדורגל העירוני', 'רחוב הדוגמה 12, חיפה', 'חיפה', 32.794, 34.9896, 'נפגשים ליד השער הראשי.'),
  ('a-basket', 'מגרש הספורט בפארק', 'רחוב הדוגמה 12, קרית אתא', 'קרית אתא', 32.8094, 35.105, 'נפגשים בכניסה המזרחית, ליד השער הכחול'),
  ('a-tennis', 'מגרשי הטניס העירוניים', 'רחוב הדוגמה 12, חיפה', 'חיפה', 32.8012, 34.995, 'מגרש מספר 2, ליד בית הקפה.'),
  ('a-yoga', 'פארק הכדורגל', 'רחוב הדוגמה 12, חיפה', 'חיפה', 32.794, 34.9896, 'המדשאה שממזרח למגרש.'),
  ('a-swim', 'היכל הספורט', 'רחוב הדוגמה 3, חיפה', 'חיפה', 32.788, 35.001, 'בלובי, ליד הדלפק.')
on conflict (activity_id) do nothing;

insert into public.participants (id, activity_id, user_id, status, approved_at) values
  ('p-a-basket-liron', 'a-basket', '11111111-1111-4111-8111-111111111111', 'approved', now()),
  ('p-a-tennis-liron', 'a-tennis', '11111111-1111-4111-8111-111111111111', 'approved', now())
on conflict (activity_id, user_id) do nothing;

insert into public.messages (id, activity_id, sender_id, body) values
  ('m1', 'a-basket', '22222222-2222-4222-8222-222222222222', 'נתכנס בכניסה המזרחית, ליד השער הכחול.'),
  ('m2', 'a-basket', '11111111-1111-4111-8111-111111111111', 'מגיע. אביא מים.')
on conflict (id) do nothing;
