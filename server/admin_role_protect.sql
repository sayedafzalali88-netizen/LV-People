-- Keeps the Admin role above HR: only an Admin (or the platform admin) can create an Admin login,
-- make someone an Admin, change or switch off an Admin, or reset an Admin's password.
-- Run once in Supabase > SQL Editor. Safe to run again. Nothing else in these functions is changed.

create or replace function public.create_login(p_employee uuid, p_role text, p_password text)
 returns uuid language plpgsql security definer set search_path to '' as $function$
declare e record; cl record; uid uuid; em text;
begin
  select * into e from public.employees where id = p_employee;
  if e.id is null then raise exception 'Employee not found'; end if;
  if not (app_private.is_platform() or (e.client_id = app_private.my_client() and app_private.is_hr())) then raise exception 'Not allowed'; end if;
  if p_role not in ('admin','hr','manager','employee') then raise exception 'Wrong role'; end if;
  if p_role = 'admin' and not (app_private.is_platform() or app_private.my_role() = 'admin') then raise exception 'Only an Admin can create an Admin login'; end if;
  if length(coalesce(p_password,'')) < 8 then raise exception 'Password must have at least 8 characters'; end if;
  if exists (select 1 from public.profiles where employee_id = p_employee) then raise exception 'This employee already has a login'; end if;
  select * into cl from public.clients where id = e.client_id;
  em := lower(e.code) || '.' || cl.code || '@login.example.com';
  uid := gen_random_uuid();
  insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change,email_change_token_new,email_change_token_current,phone_change,phone_change_token,reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',em,extensions.crypt(p_password,extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','','','','','');
  insert into auth.identities (id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
  values (gen_random_uuid(),uid,uid::text,jsonb_build_object('sub',uid::text,'email',em,'email_verified',true),'email',now(),now(),now());
  insert into public.profiles (user_id,client_id,employee_id,login_code,role,must_change_password) values (uid,e.client_id,e.id,e.code,p_role,true);
  insert into public.audit_log (client_id,user_id,module,action,subject,detail) values (e.client_id,(select auth.uid()),'Login','Created',e.code,p_role);
  return uid;
end $function$;

create or replace function public.reset_login_password(p_user uuid, p_password text)
 returns void language plpgsql security definer set search_path to '' as $function$
declare pr record;
begin
  select * into pr from public.profiles where user_id = p_user;
  if pr.user_id is null then raise exception 'Login not found'; end if;
  if not (app_private.is_platform() or (pr.client_id = app_private.my_client() and app_private.is_hr())) then raise exception 'Not allowed'; end if;
  if pr.role = 'admin' and not (app_private.is_platform() or app_private.my_role() = 'admin') then raise exception 'Only an Admin can reset the password of an Admin'; end if;
  if length(coalesce(p_password,'')) < 8 then raise exception 'Password must have at least 8 characters'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now() where id = p_user;
  update public.profiles set must_change_password = true where user_id = p_user;
  insert into public.audit_log (client_id,user_id,module,action,subject,detail) values (pr.client_id,(select auth.uid()),'Login','Password reset',pr.login_code,'');
end $function$;

create or replace function public.update_login(p_user uuid, p_role text, p_active boolean)
 returns void language plpgsql security definer set search_path to '' as $function$
declare pr record;
begin
  select * into pr from public.profiles where user_id = p_user;
  if pr.user_id is null then raise exception 'Login not found'; end if;
  if not (app_private.is_platform() or (pr.client_id = app_private.my_client() and app_private.is_hr())) then raise exception 'Not allowed'; end if;
  if p_role not in ('admin','hr','manager','employee') then raise exception 'Wrong role'; end if;
  if (pr.role = 'admin' or p_role = 'admin') and not (app_private.is_platform() or app_private.my_role() = 'admin') then raise exception 'Only an Admin can change an Admin login or make someone an Admin'; end if;
  if pr.user_id = (select auth.uid()) and (p_role <> pr.role or not p_active) then raise exception 'You cannot change your own role or switch yourself off'; end if;
  update public.profiles set role = p_role, active = p_active where user_id = p_user;
  insert into public.audit_log (client_id,user_id,module,action,subject,detail) values (pr.client_id,(select auth.uid()),'Login','Changed',pr.login_code,p_role||' '||p_active);
end $function$;
