-- Client enquiries (part 1 of the client onboarding flow): the public enquiry form, the Enquiries list of the LV team,
-- notes, status, and a separate Sales login that sees only Enquiries (and later Quotations).
-- Run once in Supabase > SQL Editor. Safe to run again.

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  no integer generated always as identity,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new','discussion','hold','lost','quoted','accepted','signed','live')),
  contacted_at timestamptz,
  gstin text,
  mobile text,
  data jsonb not null
);
create index if not exists enquiries_gstin_idx on public.enquiries (gstin);
create index if not exists enquiries_created_idx on public.enquiries (created_at desc);

create table if not exists public.enquiry_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  by_user uuid,
  by_name text,
  note text not null,
  created_at timestamptz not null default now()
);
create index if not exists enquiry_notes_enq_idx on public.enquiry_notes (enquiry_id, created_at);

create table if not exists public.platform_sales (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.enquiries enable row level security;
alter table public.enquiry_notes enable row level security;
alter table public.platform_sales enable row level security;

-- the LV team: the platform admin and the active Sales logins
create or replace function app_private.is_plat_staff() returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_platform() or exists (select 1 from public.platform_sales s where s.user_id = (select auth.uid()) and s.active)
$$;

drop policy if exists enq_staff_select on public.enquiries;
drop policy if exists enq_staff_update on public.enquiries;
create policy enq_staff_select on public.enquiries for select to authenticated using (app_private.is_plat_staff());
create policy enq_staff_update on public.enquiries for update to authenticated using (app_private.is_plat_staff()) with check (app_private.is_plat_staff());

drop policy if exists enqn_staff_select on public.enquiry_notes;
drop policy if exists enqn_staff_insert on public.enquiry_notes;
create policy enqn_staff_select on public.enquiry_notes for select to authenticated using (app_private.is_plat_staff());
create policy enqn_staff_insert on public.enquiry_notes for insert to authenticated with check (app_private.is_plat_staff());

drop policy if exists sales_select on public.platform_sales;
create policy sales_select on public.platform_sales for select to authenticated using (user_id = (select auth.uid()) or app_private.is_platform());

-- the public form: the only door for a client. Everything is checked here again.
create or replace function public.submit_enquiry(p jsonb, hp text default '') returns text language plpgsql security definer set search_path = '' as $function$
declare g text; mb text; n int; recent int; r record;
begin
  if coalesce(hp,'') <> '' then return 'ENQ-0000'; end if;                      -- a hidden field that a person never fills: a robot did
  if jsonb_typeof(p) <> 'object' then raise exception 'Invalid form'; end if;
  g := upper(trim(coalesce(p->>'gstin','')));
  mb := trim(coalesce(p->>'mobile',''));
  if length(trim(coalesce(p->>'legal',''))) < 2 or length(p->>'legal') > 150 then raise exception 'Write the legal name of the company'; end if;
  if g !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$' then raise exception 'GSTIN looks wrong (like 27ABCDE1234F1Z5)'; end if;
  if upper(trim(coalesce(p->>'pan',''))) !~ '^[A-Z]{5}[0-9]{4}[A-Z]$' then raise exception 'PAN looks wrong (like ABCDE1234F)'; end if;
  if length(trim(coalesce(p->>'address',''))) < 5 then raise exception 'Write the registered address'; end if;
  if length(trim(coalesce(p->>'person',''))) < 2 then raise exception 'Write the name of the authorised person'; end if;
  if mb !~ '^[6-9][0-9]{9}$' then raise exception 'Enter a 10 digit mobile number'; end if;
  if trim(coalesce(p->>'email','')) !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter a valid email'; end if;
  begin n := (p->>'employees')::int; exception when others then n := null; end;
  if n is null or n < 1 or n > 100000 then raise exception 'Enter the number of employees'; end if;
  if length(p::text) > 6000 then raise exception 'The form is too long'; end if;
  select count(*) into recent from public.enquiries where created_at > now() - interval '1 hour';
  if recent >= 100 then raise exception 'Too many enquiries right now. Please try again later.'; end if;
  if exists (select 1 from public.enquiries where (gstin = g or mobile = mb) and status <> 'lost' and created_at > now() - interval '90 days') then
    raise exception 'We already have an enquiry from this GSTIN or mobile number. Our team will contact you.'; end if;
  insert into public.enquiries (gstin, mobile, data) values (g, mb, p || jsonb_build_object('gstin', g, 'pan', upper(trim(p->>'pan')))) returning * into r;
  return 'ENQ-' || lpad(r.no::text, 4, '0');
end $function$;
revoke all on function public.submit_enquiry(jsonb, text) from public;
grant execute on function public.submit_enquiry(jsonb, text) to anon, authenticated;

-- Sales logins: only the platform admin can make or switch them
create or replace function public.platform_create_sales(p_name text, p_email text, p_password text) returns uuid language plpgsql security definer set search_path = '' as $function$
declare uid uuid; em text := lower(trim(coalesce(p_email,'')));
begin
  if not app_private.is_platform() then raise exception 'Only the platform admin can do this'; end if;
  if length(trim(coalesce(p_name,''))) < 2 then raise exception 'Write the name'; end if;
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter a valid email'; end if;
  if length(coalesce(p_password,'')) < 8 then raise exception 'Password must have at least 8 characters'; end if;
  if exists (select 1 from auth.users where email = em) then raise exception 'This email already has a login'; end if;
  uid := gen_random_uuid();
  insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change,email_change_token_new,email_change_token_current,phone_change,phone_change_token,reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',em,extensions.crypt(p_password,extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','','','','','');
  insert into auth.identities (id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
  values (gen_random_uuid(),uid,uid::text,jsonb_build_object('sub',uid::text,'email',em,'email_verified',true),'email',now(),now(),now());
  insert into public.platform_sales (user_id, name, email) values (uid, trim(p_name), em);
  return uid;
end $function$;
revoke all on function public.platform_create_sales(text, text, text) from public, anon;
grant execute on function public.platform_create_sales(text, text, text) to authenticated;

create or replace function public.platform_set_sales_active(p_user uuid, p_active boolean) returns void language plpgsql security definer set search_path = '' as $function$
begin
  if not app_private.is_platform() then raise exception 'Only the platform admin can do this'; end if;
  update public.platform_sales set active = p_active where user_id = p_user;
end $function$;
revoke all on function public.platform_set_sales_active(uuid, boolean) from public, anon;
grant execute on function public.platform_set_sales_active(uuid, boolean) to authenticated;

-- keeps updated_at current
create or replace function app_private.enq_touch() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists enq_touch on public.enquiries;
create trigger enq_touch before update on public.enquiries for each row execute function app_private.enq_touch();
