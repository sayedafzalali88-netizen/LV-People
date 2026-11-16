-- A reporting manager can add and change shift assignments (and so weekly offs) of the own team.
-- The app limits the manager to the own team and to months whose attendance is not processed; this rule lets the save reach the database.
-- Run once. Safe to run again.
drop policy if exists store_write_assign on public.app_store;
create policy store_write_assign on public.app_store
  for all
  using (client_id = app_private.my_client() and store = 'ASSIGN'
         and exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'manager' and p.active))
  with check (client_id = app_private.my_client() and store = 'ASSIGN'
         and exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'manager' and p.active));
