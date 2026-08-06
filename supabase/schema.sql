-- FireGuard IoT — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.user_role as enum ('USER', 'DEVELOPER');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.device_status as enum ('ONLINE', 'OFFLINE');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.alert_type as enum ('FIRE', 'SMOKE', 'SYSTEM', 'SMS');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.alert_severity as enum ('INFO', 'WARNING', 'CRITICAL');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.sms_status as enum ('PENDING', 'SENT', 'FAILED', 'NONE');
exception when duplicate_object then null;
end $$;

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null,
  role public.user_role not null default 'USER',
  theme text not null default 'system',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Devices
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete set null,
  name text not null,
  device_key text not null unique,
  status public.device_status not null default 'OFFLINE',
  wifi_ssid text,
  ip_address text,
  firmware_version text,
  last_seen timestamptz,
  smoke_threshold double precision not null default 300,
  smoke_calibration double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists devices_owner_id_idx on public.devices (owner_id);

-- Optional shared access (invite operators to a device)
create table if not exists public.device_members (
  device_id uuid not null references public.devices (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  member_role text not null default 'OPERATOR'
    check (member_role in ('OWNER', 'OPERATOR')),
  created_at timestamptz not null default now(),
  primary key (device_id, user_id)
);

create index if not exists device_members_user_id_idx
  on public.device_members (user_id);

-- Sensor readings
create table if not exists public.sensor_readings (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices (id) on delete cascade,
  smoke_level double precision not null,
  flame_detected boolean not null default false,
  temperature double precision,
  humidity double precision,
  buzzer_active boolean not null default false,
  led_status text not null default 'off',
  alarm_active boolean not null default false,
  lcd_message text,
  created_at timestamptz not null default now()
);

create index if not exists sensor_readings_device_created_idx
  on public.sensor_readings (device_id, created_at desc);

-- Alerts
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices (id) on delete cascade,
  type public.alert_type not null,
  severity public.alert_severity not null,
  title text not null,
  message text not null,
  sms_status public.sms_status not null default 'NONE',
  acknowledged boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists alerts_device_created_idx
  on public.alerts (device_id, created_at desc);

-- Connection logs
create table if not exists public.connection_logs (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices (id) on delete cascade,
  event text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists connection_logs_device_created_idx
  on public.connection_logs (device_id, created_at desc);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists devices_set_updated_at on public.devices;
create trigger devices_set_updated_at
  before update on public.devices
  for each row execute function public.set_updated_at();

-- Auto-create profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, phone)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(new.email, '@', 1)
    ),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'USER'),
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'phone'), ''),
      nullif(trim(new.raw_user_meta_data->>'sms'), '')
    )
  )
  on conflict (id) do update
    set
      email = excluded.email,
      name = coalesce(nullif(trim(excluded.name), ''), public.profiles.name),
      phone = coalesce(excluded.phone, public.profiles.phone),
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.sensor_readings enable row level security;
alter table public.alerts enable row level security;
alter table public.connection_logs enable row level security;
alter table public.device_members enable row level security;

create or replace function public.user_can_access_device(target_device_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'DEVELOPER'
    )
    or exists (
      select 1 from public.devices d
      where d.id = target_device_id and d.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.device_members m
      where m.device_id = target_device_id and m.user_id = auth.uid()
    );
$$;

revoke all on function public.user_can_access_device(uuid) from public;
grant execute on function public.user_can_access_device(uuid) to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "devices_select_authenticated" on public.devices;
drop policy if exists "devices_select_access" on public.devices;
create policy "devices_select_access"
  on public.devices for select
  to authenticated
  using (public.user_can_access_device(id));

drop policy if exists "devices_insert_own" on public.devices;
create policy "devices_insert_own"
  on public.devices for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "devices_update_developer" on public.devices;
drop policy if exists "devices_update_access" on public.devices;
create policy "devices_update_access"
  on public.devices for update
  to authenticated
  using (public.user_can_access_device(id))
  with check (public.user_can_access_device(id));

drop policy if exists "readings_select_authenticated" on public.sensor_readings;
drop policy if exists "readings_select_access" on public.sensor_readings;
create policy "readings_select_access"
  on public.sensor_readings for select
  to authenticated
  using (public.user_can_access_device(device_id));

drop policy if exists "alerts_select_authenticated" on public.alerts;
drop policy if exists "alerts_select_access" on public.alerts;
create policy "alerts_select_access"
  on public.alerts for select
  to authenticated
  using (public.user_can_access_device(device_id));

drop policy if exists "alerts_update_authenticated" on public.alerts;
drop policy if exists "alerts_update_access" on public.alerts;
create policy "alerts_update_access"
  on public.alerts for update
  to authenticated
  using (public.user_can_access_device(device_id))
  with check (public.user_can_access_device(device_id));

drop policy if exists "logs_select_authenticated" on public.connection_logs;
drop policy if exists "logs_select_access" on public.connection_logs;
create policy "logs_select_access"
  on public.connection_logs for select
  to authenticated
  using (public.user_can_access_device(device_id));

drop policy if exists "members_select_own" on public.device_members;
create policy "members_select_own"
  on public.device_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.user_can_access_device(device_id)
  );

drop policy if exists "members_insert_owner" on public.device_members;
create policy "members_insert_owner"
  on public.device_members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.devices d
      where d.id = device_id and d.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'DEVELOPER'
    )
  );

-- Unowned demo device is only visible to DEVELOPER accounts (via access helper).
insert into public.devices (
  id,
  name,
  device_key,
  status,
  firmware_version,
  smoke_threshold,
  smoke_calibration
)
values (
  '11111111-1111-1111-1111-111111111111',
  'Main Hall Sensor',
  'FG-ESP32-DEMO-001',
  'OFFLINE',
  '1.0.0',
  300,
  0
)
on conflict (device_key) do nothing;

-- Pending control commands for ESP32 to poll
create table if not exists public.device_commands (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices (id) on delete cascade,
  action text not null,
  consumed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists device_commands_pending_idx
  on public.device_commands (device_id, consumed, created_at);

alter table public.device_commands enable row level security;

drop policy if exists "commands_select_authenticated" on public.device_commands;
drop policy if exists "commands_select_access" on public.device_commands;
create policy "commands_select_access"
  on public.device_commands for select
  to authenticated
  using (public.user_can_access_device(device_id));

create index if not exists sensor_readings_created_idx
  on public.sensor_readings (created_at desc);

create index if not exists alerts_created_idx
  on public.alerts (created_at desc);
