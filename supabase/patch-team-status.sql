-- Shared LED state (default green; red after a team message).
-- Safe to re-run if you already applied team-messages.sql earlier.

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
