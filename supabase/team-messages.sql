-- Team broadcast messages (shared inbox for FireGuard operators).
-- Run in Supabase SQL Editor (Dashboard → SQL → New query).

create table if not exists public.team_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null
    check (char_length(trim(body)) > 0 and char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists team_messages_created_idx
  on public.team_messages (created_at desc);

create index if not exists team_messages_sender_idx
  on public.team_messages (sender_id);

alter table public.team_messages enable row level security;

drop policy if exists "team_messages_select_authenticated" on public.team_messages;
create policy "team_messages_select_authenticated"
  on public.team_messages for select
  to authenticated
  using (true);

drop policy if exists "team_messages_insert_own" on public.team_messages;
create policy "team_messages_insert_own"
  on public.team_messages for insert
  to authenticated
  with check (sender_id = auth.uid());

grant select, insert, delete on public.team_messages to authenticated;

drop policy if exists "team_messages_delete_authenticated" on public.team_messages;
create policy "team_messages_delete_authenticated"
  on public.team_messages for delete
  to authenticated
  using (true);

-- Shared LED state for the team dashboard (default green; red after a message).
create table if not exists public.team_status (
  id integer primary key default 1 check (id = 1),
  led_status text not null default 'green'
    check (led_status in ('green', 'red', 'amber')),
  updated_at timestamptz not null default now()
);

insert into public.team_status (id, led_status)
values (1, 'green')
on conflict (id) do nothing;

alter table public.team_status enable row level security;

drop policy if exists "team_status_select_authenticated" on public.team_status;
create policy "team_status_select_authenticated"
  on public.team_status for select
  to authenticated
  using (true);

drop policy if exists "team_status_update_authenticated" on public.team_status;
create policy "team_status_update_authenticated"
  on public.team_status for update
  to authenticated
  using (true)
  with check (true);

grant select, update on public.team_status to authenticated;
