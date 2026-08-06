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

-- Authenticated users can read their profile; update own non-role fields
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

-- All authenticated operators can read device telemetry
drop policy if exists "devices_select_authenticated" on public.devices;
create policy "devices_select_authenticated"
  on public.devices for select
  to authenticated
  using (true);

drop policy if exists "devices_update_developer" on public.devices;
create policy "devices_update_developer"
  on public.devices for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'DEVELOPER'
    )
  );

drop policy if exists "readings_select_authenticated" on public.sensor_readings;
create policy "readings_select_authenticated"
  on public.sensor_readings for select
  to authenticated
  using (true);

drop policy if exists "alerts_select_authenticated" on public.alerts;
create policy "alerts_select_authenticated"
  on public.alerts for select
  to authenticated
  using (true);

drop policy if exists "alerts_update_authenticated" on public.alerts;
create policy "alerts_update_authenticated"
  on public.alerts for update
  to authenticated
  using (true);

drop policy if exists "logs_select_authenticated" on public.connection_logs;
create policy "logs_select_authenticated"
  on public.connection_logs for select
  to authenticated
  using (true);

-- Seed demo device (safe to re-run)
insert into public.devices (
  id,
  name,
  device_key,
  status,
  wifi_ssid,
  ip_address,
  firmware_version,
  last_seen,
  smoke_threshold,
  smoke_calibration
)
values (
  '11111111-1111-1111-1111-111111111111',
  'Main Hall Sensor',
  'FG-ESP32-DEMO-001',
  'ONLINE',
  'FireGuard-Net',
  '192.168.1.50',
  '1.0.0',
  now(),
  300,
  0
)
on conflict (device_key) do nothing;

insert into public.alerts (
  device_id,
  type,
  severity,
  title,
  message,
  sms_status,
  acknowledged
)
select
  d.id,
  'SYSTEM',
  'INFO',
  'System Online',
  'FireGuard Supabase backend is ready.',
  'NONE',
  true
from public.devices d
where d.device_key = 'FG-ESP32-DEMO-001'
  and not exists (
    select 1 from public.alerts a
    where a.device_id = d.id and a.title = 'System Online'
  );
