-- The logo of a client company: the LV team uploads it (Clients (live) > Logo). Every user of that client sees it in the top bar.
-- Stored as a small picture text in clients.logo (PNG or JPG, made small in the browser). Run once. Safe to run again.
alter table public.clients add column if not exists logo text;

create or replace function public.platform_set_client_logo(p_client uuid, p_logo text) returns void language plpgsql security definer set search_path = '' as $function$
begin
  if not app_private.is_platform() then raise exception 'Only the platform admin can do this'; end if;
  if p_logo is not null and (p_logo !~ '^data:image/(png|jpeg);base64,[A-Za-z0-9+/=]+$' or length(p_logo) > 300000) then raise exception 'The logo must be a PNG or JPG picture, small in size'; end if;
  update public.clients set logo = p_logo where id = p_client;
  if not found then raise exception 'Client not found'; end if;
end $function$;
revoke all on function public.platform_set_client_logo(uuid, text) from public, anon;
grant execute on function public.platform_set_client_logo(uuid, text) to authenticated;

-- the login page shows the logo of the company whose code is typed (only the logo; a suspended client shows none)
create or replace function public.client_logo_by_code(p_code text) returns text language sql stable security definer set search_path = '' as $$
  select logo from public.clients where code = lower(trim(coalesce(p_code,''))) and status <> 'suspended' and logo is not null limit 1
$$;
revoke all on function public.client_logo_by_code(text) from public;
grant execute on function public.client_logo_by_code(text) to anon, authenticated;
