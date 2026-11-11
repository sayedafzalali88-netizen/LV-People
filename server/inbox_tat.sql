-- Inbox last dates and KPI-399 "Inbox Tasks Done Before Due %".
--  1. Employees may save their own lines of the Inbox ledger (store IBL): first seen, last date, done on.
--  2. An employee can write only his own lines; the first-seen date, the last date and a done date cannot be changed afterwards.
--  3. KPI-399 in the KPI library and in the pack of every client (HR still assigns it by hand in PMS > KPI assignment).
-- Run once in Supabase > SQL Editor. Safe to run again.

create or replace function app_private.emp_store(p text) returns boolean language sql immutable set search_path = '' as $$
  select p = any(array['LEAVES','AR','REGS','RH','ADV','MRATE','AUD','CT','KYC','SURV','TASKS','WFI','DEC','MTG','CHAL','RFL','BIL','CLF','EL','SVL','EVP','CCO','STKA','SUPT','AIS','AREQ',
    'FBT','CFB','ASG','TODO','DAILYT','SLP','SLASG','SLLOG','SLT','SLCERT','CREQ','XADV','XREP','XRES','XTRIP','UREQ','WISH','CHE','POLL','RECOG',
    'SRC.content','SRC.campaign','SRC.post','SRC.creview','SRC.ttest','SRC.audience','AUDIT','TDSD','IBL']) $$;

-- the rule for IBL is put into the existing guard, in front of the rule for the other stores (the rest of the guard is not touched)
do $do$
declare d text; anchor text := $a$  if new.store not in ('LEAVES','RH','REGS','AR','ADV') then$a$;
  ins text := $ins$  if new.store = 'IBL' then
    if split_part(substr(new.key,3),'|',1) !~ '^\d+$' or split_part(substr(new.key,3),'|',1)::int <> me or (n->>'emp') is distinct from me::text then raise exception 'Not allowed'; end if;
    if o is not null and ((o->'at') is distinct from (n->'at') or (o->'due') is distinct from (n->'due') or (coalesce(o->>'done','') <> '' and (o->'done') is distinct from (n->'done'))) then raise exception 'An Inbox record cannot be changed'; end if;
    return new;
  end if;
$ins$;
begin
  select pg_get_functiondef(p.oid) into d from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'app_private' and p.proname = 'store_guard';
  if d is null then raise exception 'store_guard not found'; end if;
  if position($x$new.store = 'IBL'$x$ in d) = 0 then
    if position(anchor in d) = 0 then raise exception 'store_guard has changed: add the IBL rule by hand'; end if;
    execute replace(d, anchor, ins || anchor);
  end if;
end $do$;

insert into public.kpi_library (id, data, module, status)
values ('KPI-399', jsonb_build_object('id','KPI-399','cat','Common (All Designations)','max',10,'freq','Monthly','name','Inbox Tasks Done Before Due %','level','Data','method','Auto',
  'rule','Inbox — Every item that comes to the person''s Inbox (approvals, work to do, acknowledgements of letters, decisions, documents and assets, notices to read) has a last date: its own last date, or the day it came plus the working days of SLA-053 (approval or other work 2, acknowledgement 3, notice 2; Sundays and holidays are not counted). Items whose last date is in the month and has passed, or that are already finished: finished on or before the last date ÷ such items × 100. Finished late, or still open after the last date = late. To Do items and Today''s Challenge are left out (they have their own KPI). No item in the month = not counted. Counted for items due from 1 December 2026.'),
  'pms', 'released')
on conflict (id) do update set data = excluded.data, module = excluded.module, status = excluded.status, updated_at = now();

insert into public.client_kpi_pack (client_id, kpi_id, enabled, max)
select c.id, 'KPI-399', true, 10 from public.clients c
on conflict do nothing;
