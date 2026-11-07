-- Leave back-date limit: the database now follows the Attendance policy (Core Setting > Attendance policy > Back date > Leave),
-- instead of a fixed 30 days.
--  * An employee applying for themselves: limited to the loosest "Leave" back-date days of the active policies of the company (0 = only today and later).
--    The loosest one is used so that the database never blocks what the screen allows; the screen applies the exact policy of the person.
--  * HR or Admin applying on behalf of an employee: up to 30 days back, as before.
-- Run once in Supabase > SQL Editor. Safe to run again. Nothing else in apply_leave is changed.

create or replace function public.apply_leave(p_type uuid, p_from date, p_to date, p_half boolean, p_reason text, p_employee uuid default null::uuid)
 returns uuid language plpgsql security definer set search_path to '' as $function$
declare emp record; lt record; n numeric; d date; wo text; avail numeric; ys date; rid uuid; bl int; lim int; own boolean; today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  own := (p_employee is null or p_employee = app_private.my_employee());
  if own then
    select * into emp from public.employees where id = app_private.my_employee();
  else
    if not app_private.is_hr() then raise exception 'Not allowed'; end if;
    select * into emp from public.employees where id = p_employee and client_id = app_private.my_client();
  end if;
  if emp.id is null or not emp.active then raise exception 'Employee not found or not working'; end if;
  select * into lt from public.leave_types where id = p_type and client_id = emp.client_id and active;
  if lt.id is null then raise exception 'Leave type not found'; end if;
  if p_from is null or p_to is null or p_to < p_from then raise exception 'Check the dates'; end if;
  select coalesce(max(least(greatest((a.data->'back'->>'leave')::int, 0), 365)), 3) into bl
    from public.app_store a where a.client_id = emp.client_id and a.store = 'ATPOL' and a.key like 'id:%' and coalesce((a.data->>'active')::boolean, true);
  lim := case when own then coalesce(bl, 3) else 30 end;
  if p_from < today - lim then
    if lim = 0 then raise exception 'Past dates are not allowed for leave';
    else raise exception 'Leave can be applied for the last % day(s) only', lim; end if;
  end if;
  if p_to > current_date + 365 then raise exception 'Date is too far ahead'; end if;
  if coalesce(p_half,false) and (p_from <> p_to or not lt.allow_half) then raise exception 'Half day is for a single day of a leave type that allows it'; end if;
  wo := coalesce(emp.weekly_off, '0');
  n := 0; d := p_from;
  while d <= p_to loop
    if extract(dow from d)::text <> wo and not exists (select 1 from public.holidays h where h.client_id = emp.client_id and h.hdate = d) then n := n + 1; end if;
    d := d + 1;
  end loop;
  if n = 0 then raise exception 'There is no working day in these dates (holidays and weekly off are not counted)'; end if;
  if coalesce(p_half,false) then n := 0.5; end if;
  if exists (select 1 from public.leave_requests r where r.employee_id = emp.id and r.status in ('pending','approved') and r.from_date <= p_to and r.to_date >= p_from) then raise exception 'You already have a leave in these dates'; end if;
  if lt.yearly_quota > 0 then
    ys := app_private.leave_year_start(emp.client_id, p_from);
    select lt.yearly_quota - coalesce(sum(r.days),0) into avail from public.leave_requests r where r.employee_id = emp.id and r.type_id = lt.id and r.status in ('approved','pending') and r.from_date >= ys and r.from_date < ys + interval '1 year';
    if n > avail then raise exception 'Not enough balance: % available, % asked', avail, n; end if;
  end if;
  insert into public.leave_requests (client_id, employee_id, type_id, from_date, to_date, days, half, reason, created_by)
  values (emp.client_id, emp.id, lt.id, p_from, p_to, n, coalesce(p_half,false), nullif(trim(p_reason),''), (select auth.uid())) returning id into rid;
  insert into public.audit_log (client_id, user_id, module, action, subject, detail) values (emp.client_id, (select auth.uid()), 'Leave', 'Applied', emp.code, lt.code||' '||p_from||' to '||p_to||' ('||n||')');
  return rid;
end $function$;
