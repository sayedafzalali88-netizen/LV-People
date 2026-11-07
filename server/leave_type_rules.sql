-- The database now checks the rules of the Leave types too, not only the screen:
--   * Who can take: gender, and the groups chosen in "Who can take" (Function, Branch, Division, Sub-division, Department, Designation, Career level, Specific employee)
--   * Most days in one request, and the Notice by the length of the leave (for an employee applying for themselves)
-- It also keeps the back-date limit of the Attendance policy (see leave_backdate_policy.sql), so run THIS file; it replaces that one.
-- HR or Admin applying on behalf of an employee: the eligibility checks apply, the notice and "most days" checks do not, and back-date is up to 30 days.
-- Days are counted as working days here (weekly off and holidays are not counted); the screen may count a few more days when the sandwich rule applies.
-- Run once in Supabase > SQL Editor. Safe to run again.

create or replace function public.apply_leave(p_type uuid, p_from date, p_to date, p_half boolean, p_reason text, p_employee uuid default null::uuid)
 returns uuid language plpgsql security definer set search_path to '' as $function$
declare emp record; lt record; n numeric; d date; wo text; avail numeric; ys date; rid uuid; bl int; lim int; own boolean; today date := (now() at time zone 'Asia/Kolkata')::date;
  lm jsonb; aud jsonb; ds jsonb; ok boolean; need int; dsn int; mx numeric;
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

  -- the rules of this leave type, as set in Core Setting > Leave types
  select a.data into lm from public.app_store a where a.client_id = emp.client_id and a.store = 'LTM' and a.key like 'id:%' and a.data->>'code' = lt.code limit 1;
  if lm is not null then
    if coalesce(lm->>'gender','All') in ('F','M') and coalesce(emp.gender,'') <> lm->>'gender' then raise exception 'This leave type is not available for you'; end if;
    ds := case when jsonb_typeof(lm->'desigs') = 'array' then lm->'desigs' else '[]'::jsonb end;
    if jsonb_array_length(ds) > 0 and not exists (select 1 from public.designations t, jsonb_array_elements_text(ds) x where t.id = emp.designation_id and t.num_id = x::int) then
      raise exception 'This leave type is not available for you'; end if;
    aud := case when jsonb_typeof(lm->'aud') = 'array' then lm->'aud' else '[]'::jsonb end;
    if jsonb_array_length(aud) > 0 then
      select exists (select 1 from jsonb_array_elements(aud) x where
           (x->>'d' = 'emp'      and emp.num_id = (x->>'v')::int)
        or (x->>'d' = 'level'    and emp.level = (x->>'v')::int)
        or (x->>'d' = 'func'     and exists (select 1 from public.job_functions t where t.id = emp.function_id and t.num_id = (x->>'v')::int))
        or (x->>'d' = 'branch'   and exists (select 1 from public.branches t where t.id = emp.branch_id and t.num_id = (x->>'v')::int))
        or (x->>'d' = 'division' and exists (select 1 from public.divisions t where t.id = emp.division_id and t.num_id = (x->>'v')::int))
        or (x->>'d' = 'subdiv'   and exists (select 1 from public.sub_divisions t where t.id = emp.sub_division_id and t.num_id = (x->>'v')::int))
        or (x->>'d' = 'dept'     and exists (select 1 from public.departments t where t.id = emp.department_id and t.num_id = (x->>'v')::int))
        or (x->>'d' = 'desig'    and exists (select 1 from public.designations t where t.id = emp.designation_id and t.num_id = (x->>'v')::int))
      ) into ok;
      if not ok then raise exception 'This leave type is not available for you'; end if;
    end if;
  end if;

  -- back date: the Attendance policy (Core Setting > Attendance policy > Back date > Leave)
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

  -- most days in one request, and the notice by the length of the leave (the person applying for themselves)
  if own and lm is not null then
    mx := coalesce((lm->>'maxDays')::numeric, 0);
    if mx > 0 and n > mx then raise exception 'At most % day(s) in one request', mx; end if;
    need := 0;
    if jsonb_typeof(lm->'noticeRows') = 'array' and jsonb_array_length(lm->'noticeRows') > 0 then
      dsn := greatest(1, ceil(n)::int);
      select coalesce(
        (select (r->>'days')::int from jsonb_array_elements(lm->'noticeRows') r where (r->>'len')::int <= dsn order by (r->>'len')::int desc limit 1),
        (select (r->>'days')::int from jsonb_array_elements(lm->'noticeRows') r order by (r->>'len')::int asc limit 1)) into need;
    else
      need := coalesce((lm->>'notice')::int, 0);
    end if;
    if need > 0 and (p_from - today) < need then raise exception 'A leave of % day(s) needs a notice of % day(s)', n, need; end if;
  end if;

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
