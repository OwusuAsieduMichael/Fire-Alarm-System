-- Allow clearing team messages on system reset.
-- Safe to re-run.

drop policy if exists "team_messages_delete_authenticated" on public.team_messages;
create policy "team_messages_delete_authenticated"
  on public.team_messages for delete
  to authenticated
  using (true);

grant delete on public.team_messages to authenticated;
