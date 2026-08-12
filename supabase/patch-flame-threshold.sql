-- Add adjustable flame threshold alongside smoke threshold.
-- Safe to re-run.

alter table public.devices
  add column if not exists flame_threshold double precision not null default 1000;

-- Align presentation defaults for existing rows that still use the old smoke default.
update public.devices
set smoke_threshold = 60
where smoke_threshold = 300;
