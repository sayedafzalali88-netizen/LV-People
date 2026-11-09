-- Quotations (part 2 of the client onboarding flow): our own company details, quotations with revisions, and the status flow
-- Draft -> Sent -> Accepted (or Rejected), a new revision replaces the old one.
-- Every change goes through a function; nobody changes a row directly. Only the LV team (platform admin and Sales logins) can read them.
-- Run once in Supabase > SQL Editor. Safe to run again.

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.platform_settings enable row level security;
drop policy if exists ps_staff_select on public.platform_settings;
create policy ps_staff_select on public.platform_settings for select to authenticated using (app_private.is_plat_staff());
revoke all on public.platform_settings from anon;
grant select on public.platform_settings to authenticated;

insert into public.platform_settings (key, value) values ('company', jsonb_build_object(
  'legal', '', 'trade', 'LV People',
  'address', 'Narayanpur', 'state', 'Chhattisgarh', 'pin', '494661',
  'gstin', '22AAHCS7925Q1ZA', 'pan', 'AAHCS7925Q', 'sac', '998431', 'gst', 18,
  'bank', jsonb_build_object('name', '', 'holder', '', 'acc', '', 'ifsc', ''),
  'payDays', 15, 'validDays', 15,
  'support', 'Monday to Friday, 10:00 am to 6:00 pm',
  'dataTerm', 'The data of the client remains the property of the client. Return or export of the data is subject to the clearance of all dues by the client.',
  'signName', 'Dr. Sayed Afzal Ali', 'signDesig', 'Director'))
on conflict (key) do nothing;

create or replace function public.platform_save_company(p jsonb) returns void language plpgsql security definer set search_path = '' as $function$
begin
  if not app_private.is_platform() then raise exception 'Only the platform admin can change these details'; end if;
  if jsonb_typeof(p) <> 'object' or length(p::text) > 8000 then raise exception 'Invalid details'; end if;
  if coalesce(p->>'gstin','') <> '' and upper(p->>'gstin') !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$' then raise exception 'GSTIN looks wrong'; end if;
  if coalesce(p->>'pan','') <> '' and upper(p->>'pan') !~ '^[A-Z]{5}[0-9]{4}[A-Z]$' then raise exception 'PAN looks wrong'; end if;
  insert into public.platform_settings (key, value, updated_at) values ('company', p, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
end $function$;
revoke all on function public.platform_save_company(jsonb) from public, anon;
grant execute on function public.platform_save_company(jsonb) to authenticated;

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete restrict,
  rev integer not null,
  no text not null,
  status text not null default 'draft' check (status in ('draft','sent','accepted','rejected','superseded')),
  data jsonb not null,
  created_by text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  accepted_at timestamptz,
  accepted_by text,
  rejected_at timestamptz,
  reject_reason text,
  unique (enquiry_id, rev)
);
create index if not exists quotations_enq_idx on public.quotations (enquiry_id, rev);
alter table public.quotations enable row level security;
drop policy if exists q_staff_select on public.quotations;
create policy q_staff_select on public.quotations for select to authenticated using (app_private.is_plat_staff());
revoke all on public.quotations from anon;
grant select on public.quotations to authenticated;

-- checks the numbers of a quotation
create or replace function app_private.quote_check(p jsonb) returns void language plpgsql immutable set search_path = '' as $function$
begin
  if jsonb_typeof(p) <> 'object' or length(p::text) > 12000 then raise exception 'Invalid quotation'; end if;
  if coalesce(p->>'cycle','') not in ('Monthly','Quarterly','Yearly') then raise exception 'Choose the billing cycle'; end if;
  if coalesce((p->>'term')::int, 0) < 1 then raise exception 'Contract months are required'; end if;
  if coalesce((p->>'base')::numeric, 0) <= 0 then raise exception 'Base fee is required'; end if;
  if coalesce((p->>'incl')::int, 0) < 1 then raise exception 'Included employees are required'; end if;
  if coalesce((p->>'rate')::numeric, 0) < 0 or coalesce((p->>'setup')::numeric, 0) < 0 or coalesce((p->>'hardPct')::numeric, 0) < 0 then raise exception 'Amounts cannot be negative'; end if;
  if not exists (select 1 from jsonb_each_text(coalesce(p->'mods','{}'::jsonb)) where value = 'true') then raise exception 'Choose at least one module'; end if;
  if coalesce(p->>'valid','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Choose the date the quotation is valid till'; end if;
end $function$;

create or replace function public.quotation_create(p_enquiry uuid, p_data jsonb) returns uuid language plpgsql security definer set search_path = '' as $function$
declare e record; rid uuid; who text;
begin
  if not app_private.is_plat_staff() then raise exception 'Not allowed'; end if;
  select * into e from public.enquiries where id = p_enquiry;
  if e.id is null then raise exception 'Enquiry not found'; end if;
  if e.status in ('lost','live') then raise exception 'A quotation cannot be made for this enquiry now'; end if;
  if exists (select 1 from public.quotations where enquiry_id = p_enquiry and status in ('draft','sent','accepted')) then raise exception 'This enquiry already has a quotation. Open it, or revise it.'; end if;
  perform app_private.quote_check(p_data);
  select coalesce((select name from public.platform_sales where user_id = (select auth.uid())), (select email from auth.users where id = (select auth.uid()))) into who;
  insert into public.quotations (enquiry_id, rev, no, data, created_by)
  values (p_enquiry, coalesce((select max(rev) from public.quotations where enquiry_id = p_enquiry), 0) + 1, 'QT-' || lpad(e.no::text, 4, '0') || '-R' || (coalesce((select max(rev) from public.quotations where enquiry_id = p_enquiry), 0) + 1), p_data, who)
  returning id into rid;
  return rid;
end $function$;

create or replace function public.quotation_save(p_id uuid, p_data jsonb) returns void language plpgsql security definer set search_path = '' as $function$
begin
  if not app_private.is_plat_staff() then raise exception 'Not allowed'; end if;
  perform app_private.quote_check(p_data);
  update public.quotations set data = p_data where id = p_id and status = 'draft';
  if not found then raise exception 'Only a draft can be changed. Use Revise for a sent quotation.'; end if;
end $function$;

create or replace function public.quotation_send(p_id uuid) returns void language plpgsql security definer set search_path = '' as $function$
declare q record;
begin
  if not app_private.is_plat_staff() then raise exception 'Not allowed'; end if;
  update public.quotations set status = 'sent', sent_at = now() where id = p_id and status = 'draft' returning * into q;
  if q.id is null then raise exception 'Only a draft can be marked as sent'; end if;
  update public.enquiries set status = 'quoted' where id = q.enquiry_id and status in ('new','discussion','hold','quoted');
end $function$;

create or replace function public.quotation_revise(p_id uuid, p_data jsonb) returns uuid language plpgsql security definer set search_path = '' as $function$
declare q record; e record; rid uuid; who text; nr int;
begin
  if not app_private.is_plat_staff() then raise exception 'Not allowed'; end if;
  perform app_private.quote_check(p_data);
  select * into q from public.quotations where id = p_id for update;
  if q.id is null then raise exception 'Quotation not found'; end if;
  if q.status not in ('sent','rejected') then raise exception 'Only a sent or rejected quotation can be revised'; end if;
  select * into e from public.enquiries where id = q.enquiry_id;
  select coalesce((select name from public.platform_sales where user_id = (select auth.uid())), (select email from auth.users where id = (select auth.uid()))) into who;
  nr := (select max(rev) from public.quotations where enquiry_id = q.enquiry_id) + 1;
  update public.quotations set status = 'superseded' where id = q.id;
  insert into public.quotations (enquiry_id, rev, no, data, created_by) values (q.enquiry_id, nr, 'QT-' || lpad(e.no::text, 4, '0') || '-R' || nr, p_data, who) returning id into rid;
  if e.status = 'hold' then update public.enquiries set status = 'discussion' where id = e.id; end if;
  return rid;
end $function$;

create or replace function public.quotation_reject(p_id uuid, p_reason text) returns void language plpgsql security definer set search_path = '' as $function$
declare q record;
begin
  if not app_private.is_plat_staff() then raise exception 'Not allowed'; end if;
  update public.quotations set status = 'rejected', rejected_at = now(), reject_reason = nullif(trim(p_reason), '') where id = p_id and status = 'sent' returning * into q;
  if q.id is null then raise exception 'Only a sent quotation can be marked as rejected'; end if;
  update public.enquiries set status = 'hold' where id = q.enquiry_id and status = 'quoted';
end $function$;

create or replace function public.quotation_accept(p_id uuid) returns void language plpgsql security definer set search_path = '' as $function$
declare q record; who text;
begin
  if not app_private.is_plat_staff() then raise exception 'Not allowed'; end if;
  select coalesce((select name from public.platform_sales where user_id = (select auth.uid())), (select email from auth.users where id = (select auth.uid()))) into who;
  update public.quotations set status = 'accepted', accepted_at = now(), accepted_by = who where id = p_id and status = 'sent' returning * into q;
  if q.id is null then raise exception 'Only a sent quotation can be accepted'; end if;
  update public.enquiries set status = 'accepted' where id = q.enquiry_id;
end $function$;

-- an accepted or replaced quotation can never be changed
create or replace function app_private.quote_lock() returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status in ('accepted','superseded') and (new.data is distinct from old.data or new.status is distinct from old.status or new.rev is distinct from old.rev) then
    raise exception 'This quotation is locked'; end if;
  return new;
end $$;
drop trigger if exists quote_lock on public.quotations;
create trigger quote_lock before update on public.quotations for each row execute function app_private.quote_lock();

do $$ declare f text; begin
  foreach f in array array['quotation_create(uuid,jsonb)','quotation_save(uuid,jsonb)','quotation_send(uuid)','quotation_revise(uuid,jsonb)','quotation_reject(uuid,text)','quotation_accept(uuid)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- later additions (already applied): the status buttons of an enquiry go through a function, and the tables allow reading only
create or replace function public.enquiry_set_status(p_id uuid, p_status text) returns void language plpgsql security definer set search_path = '' as $function$
declare e record;
begin
  if not app_private.is_plat_staff() then raise exception 'Not allowed'; end if;
  if p_status not in ('discussion','hold','lost') then raise exception 'This status is set by the quotation, not by hand'; end if;
  select * into e from public.enquiries where id = p_id for update;
  if e.id is null then raise exception 'Enquiry not found'; end if;
  if e.status in ('accepted','signed','live') then raise exception 'This enquiry has an accepted quotation. It cannot be moved back.'; end if;
  update public.enquiries set status = p_status, contacted_at = case when p_status = 'discussion' and contacted_at is null then now() else contacted_at end where id = p_id;
end $function$;
revoke all on function public.enquiry_set_status(uuid, text) from public, anon;
grant execute on function public.enquiry_set_status(uuid, text) to authenticated;
revoke all on public.quotations, public.platform_settings, public.enquiries, public.enquiry_notes, public.platform_sales from authenticated;
grant select on public.quotations, public.platform_settings, public.enquiries, public.platform_sales to authenticated;
grant select, insert on public.enquiry_notes to authenticated;
