-- Add ESP32 command queue + ensure placeholder device is OFFLINE (no fake live data).
-- Run in Supabase SQL Editor if schema was already applied.

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
create policy "commands_select_authenticated"
  on public.device_commands for select
  to authenticated
  using (true);

update public.devices
set
  status = 'OFFLINE',
  wifi_ssid = null,
  ip_address = null,
  last_seen = null
where device_key = 'FG-ESP32-DEMO-001'
  and last_seen is null;

-- Optional: remove old simulator bootstrap alert
delete from public.alerts
where title = 'System Online'
  and message like '%Supabase backend is ready%';
