-- Multi-account ownership + traffic-friendly indexes.
-- Safe to re-run in Supabase SQL Editor.

-- ESP32 command queue (required before command RLS policies)
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

-- Who owns each device
alter table public.devices
  add column if not exists owner_id uuid references public.profiles (id) on delete set null;

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

alter table public.device_members enable row level security;

-- Access helper (security definer so RLS can call it safely)
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

-- Replace open "anyone authenticated" policies with ownership-scoped ones
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

drop policy if exists "commands_select_authenticated" on public.device_commands;
drop policy if exists "commands_select_access" on public.device_commands;
create policy "commands_select_access"
  on public.device_commands for select
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

-- Keep recent telemetry fast under load
create index if not exists sensor_readings_created_idx
  on public.sensor_readings (created_at desc);

create index if not exists alerts_created_idx
  on public.alerts (created_at desc);

-- Optional cleanup (run separately if needed; can timeout in SQL Editor on large tables):
-- delete from public.sensor_readings
-- where created_at < now() - interval '30 days';
