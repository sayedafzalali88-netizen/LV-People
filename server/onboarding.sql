-- Onboarding (part 3 of the client onboarding flow): the steps of an accepted enquiry, Make live (creates the client company from the accepted
-- quotation, in Test status) and Make Active. Already applied to the database; kept here as a record. Safe to run again.

alter table public.enquiries add column if not exists client_id uuid references public.clients(id);

create table if not exists public.enquiry_steps (
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  key text not null,
  done_at timestamptz not null default now(),
  done_by text,
  note text,
  primary key (enquiry_id, key)
);
alter table public.enquiry_steps enable row level security;
drop policy if exists es_staff_select on public.enquiry_steps;
create policy es_staff_select on public.enquiry_steps for select to authenticated using (app_private.is_plat_staff());
revoke all on public.enquiry_steps from anon, authenticated;
grant select on public.enquiry_steps to authenticated;

create or replace function app_private.who() returns text language sql stable security definer set search_path = '' as $$
  select coalesce((select name from public.platform_sales where user_id = (select auth.uid())), (select email from auth.users where id = (select auth.uid())), 'LV team')
$$;

-- ticks a step of an accepted enquiry. The platform admin only: agreement_signed and advance. Make live and Make Active have their own functions.
create or replace function public.onboarding_step(p_enquiry uuid, p_key text, p_done boolean, p_note text default null) returns void language plpgsql security definer set search_path = '' as $function$
declare e record;
begin
  if not app_private.is_plat_staff() then raise exception 'Not allowed'; end if;
  if p_key not in ('agreement_sent','form_sent','checklist_sent','agreement_signed','form_received','advance','s_modules','s_kpi','s_org','s_emps','s_rights','s_shifts','s_training','s_login') then raise exception 'Unknown step'; end if;
  if p_key in ('agreement_signed','advance') and not app_private.is_platform() then raise exception 'Only the platform admin can tick this step'; end if;
  select * into e from public.enquiries where id = p_enquiry for update;
  if e.id is null then raise exception 'Enquiry not found'; end if;
  if not exists (select 1 from public.quotations where enquiry_id = p_enquiry and status = 'accepted') then raise exception 'There is no accepted quotation for this enquiry'; end if;
  if p_key = 'agreement_signed' and not p_done and e.status = 'live' then raise exception 'The client is already live'; end if;
  if p_done then
    insert into public.enquiry_steps (enquiry_id, key, done_by, note) values (p_enquiry, p_key, app_private.who(), nullif(trim(p_note), ''))
    on conflict (enquiry_id, key) do update set done_at = now(), done_by = excluded.done_by, note = excluded.note;
    if p_key = 'agreement_signed' and e.status = 'accepted' then update public.enquiries set status = 'signed' where id = p_enquiry; end if;
  else
    delete from public.enquiry_steps where enquiry_id = p_enquiry and key = p_key;
    if p_key = 'agreement_signed' and e.status = 'signed' then update public.enquiries set status = 'accepted' where id = p_enquiry; end if;
  end if;
end $function$;

-- creates the client company from the accepted quotation: its modules, and the employee limit = the hard cap. Starts in Test.
create or replace function public.enquiry_make_live(p_enquiry uuid, p_code text, p_admin_name text, p_admin_code text, p_admin_mobile text, p_password text) returns uuid language plpgsql security definer set search_path = '' as $function$
declare e record; q record; cid uuid; lim int; mods text[];
begin
  if not app_private.is_platform() then raise exception 'Only the platform admin can make a client live'; end if;
  select * into e from public.enquiries where id = p_enquiry for update;
  if e.id is null then raise exception 'Enquiry not found'; end if;
  if e.client_id is not null then raise exception 'The client is already created'; end if;
  if e.status <> 'signed' then raise exception 'Mark the agreement as signed first'; end if;
  select * into q from public.quotations where enquiry_id = p_enquiry and status = 'accepted';
  if q.id is null then raise exception 'There is no accepted quotation'; end if;
  lim := ceil((q.data->>'incl')::numeric * (1 + coalesce((q.data->>'hardPct')::numeric, 0) / 100))::int;
  select array_agg(k order by k) into mods from jsonb_each_text(q.data->'mods') as t(k, v) where v = 'true';
  cid := public.platform_create_client(p_code, q.data->'client'->>'name', lim, mods, p_admin_name, p_admin_code, p_admin_mobile, p_password);
  perform public.platform_update_client(cid, 'test', lim, mods);
  update public.enquiries set status = 'live', client_id = cid where id = p_enquiry;
  insert into public.enquiry_steps (enquiry_id, key, done_by, note) values (p_enquiry, 'live', app_private.who(), 'code ' || lower(trim(p_code)) || ', ' || q.no) on conflict (enquiry_id, key) do nothing;
  return cid;
end $function$;

create or replace function public.enquiry_activate(p_enquiry uuid) returns void language plpgsql security definer set search_path = '' as $function$
declare e record; c record;
begin
  if not app_private.is_platform() then raise exception 'Only the platform admin can switch a client to Active'; end if;
  select * into e from public.enquiries where id = p_enquiry for update;
  if e.id is null or e.client_id is null then raise exception 'The client is not created yet'; end if;
  select * into c from public.clients where id = e.client_id;
  perform public.platform_update_client(c.id, 'active', c.employee_limit, c.modules);
  insert into public.enquiry_steps (enquiry_id, key, done_by) values (p_enquiry, 's_active', app_private.who()) on conflict (enquiry_id, key) do nothing;
end $function$;

do $$ declare f text; begin
  foreach f in array array['onboarding_step(uuid,text,boolean,text)','enquiry_make_live(uuid,text,text,text,text,text)','enquiry_activate(uuid)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;