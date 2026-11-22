-- نادي الفحيحيل — فريق تحت 15 | قاعدة بيانات مستقلة (لا علاقة لها بسترايك)
create schema if not exists private;

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  email text unique,
  sort int not null default 0
);

create table public.players (
  id text primary key,
  name text not null,
  number int,
  dob date,
  position text,
  alt_positions text,
  foot text,
  height numeric,
  weight numeric,
  measured_at date,
  phone text,
  guardian_name text,
  guardian_phone text,
  status text not null default 'متاح',
  status_note text,
  notes text,
  photo text,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.sheets (
  id text primary key,
  kind text not null default 'session',
  title text,
  date date,
  age text,
  coach text,
  goal_tech text,
  goal_phys text,
  summary jsonb not null default '[]'::jsonb,
  thumbs jsonb not null default '{}'::jsonb,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.events (
  id text primary key,
  type text not null default 'training',
  date date not null,
  time text,
  duration int,
  place text,
  title text,
  goal_tech text,
  goal_phys text,
  status text not null default 'scheduled',
  cancel_reason text,
  sheet_id text references public.sheets(id) on delete set null,
  rpe numeric,
  actual_duration int,
  notes_after text,
  opponent text,
  competition text,
  home_away text,
  meet_time text,
  meet_place text,
  score_for int,
  score_against int,
  updated_at timestamptz not null default now()
);
create index events_date_idx on public.events(date);
create index events_sheet_idx on public.events(sheet_id);

create table public.attendance (
  id text primary key,
  event_id text not null references public.events(id) on delete cascade,
  player_id text not null references public.players(id) on delete cascade,
  status text not null,
  late_min int,
  reason text,
  updated_at timestamptz not null default now(),
  unique (event_id, player_id)
);
create index attendance_player_idx on public.attendance(player_id);

create table public.match_stats (
  id text primary key,
  event_id text not null references public.events(id) on delete cascade,
  player_id text not null references public.players(id) on delete cascade,
  started boolean not null default false,
  minutes int,
  goals int not null default 0,
  assists int not null default 0,
  yellow int not null default 0,
  red int not null default 0,
  position text,
  updated_at timestamptz not null default now(),
  unique (event_id, player_id)
);
create index match_stats_player_idx on public.match_stats(player_id);

create table public.settings (
  id text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- الدخول للطاقم فقط: الإيميل لازم يكون مسجل في جدول staff
create or replace function private.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff s where lower(s.email) = lower(auth.jwt() ->> 'email'));
$$;
revoke all on function private.is_staff() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_staff() to authenticated;

create or replace function private.block_non_staff_signup() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.staff s where lower(s.email) = lower(new.email)) then
    raise exception 'هذا الإيميل غير مصرح له بالدخول';
  end if;
  -- الطاقم المسجل في جدول staff يتفعّل مباشرة بدون رسالة تأكيد على الإيميل
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end $$;
revoke all on function private.block_non_staff_signup() from public, anon, authenticated;
create trigger staff_only_signup before insert on auth.users
  for each row execute function private.block_non_staff_signup();

do $$
declare t text;
begin
  foreach t in array array['staff','players','sheets','events','attendance','match_stats','settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    if t = 'staff' then
      execute 'create policy staff_read on public.staff for select to authenticated using ((select private.is_staff()))';
    else
      execute format('create policy staff_all on public.%I for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()))', t);
    end if;
  end loop;
end $$;
revoke insert, update, delete on public.staff from authenticated;

insert into public.staff (name, role, sort) values
  ('مشعل المنصور', 'مدرب الفريق', 1),
  ('جاسم الباطني', 'مساعد المدرب', 2),
  ('عبدالله الرتيبان', 'إداري الفريق', 3);
