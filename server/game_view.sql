-- Game view: the person's choice (view, colour, hidden guides, badges already celebrated) is kept on the server in the store GVP,
-- one line per employee. An employee can write only his own line. The badges of the month (store BDG) are written by Admin and HR only.
-- Run once in Supabase > SQL Editor, after inbox_tat.sql. Safe to run again.

create or replace function app_private.emp_store(p text) returns boolean language sql immutable set search_path = '' as $$
  select p = any(array['LEAVES','AR','REGS','RH','ADV','MRATE','AUD','CT','KYC','SURV','TASKS','WFI','DEC','MTG','CHAL','RFL','BIL','CLF','EL','SVL','EVP','CCO','STKA','SUPT','AIS','AREQ',
    'FBT','CFB','ASG','TODO','DAILYT','SLP','SLASG','SLLOG','SLT','SLCERT','CREQ','XADV','XREP','XRES','XTRIP','UREQ','WISH','CHE','POLL','RECOG',
    'SRC.content','SRC.campaign','SRC.post','SRC.creview','SRC.ttest','SRC.audience','AUDIT','TDSD','IBL','GVP']) $$;

do $do$
declare d text; anchor text := $a$  if new.store = 'IBL' then$a$;
  ins text := $ins$  if new.store = 'GVP' then
    if substr(new.key,3) !~ '^\d+$' or substr(new.key,3)::int <> me or (n->>'emp') is distinct from me::text then raise exception 'Not allowed'; end if;
    return new;
  end if;
$ins$;
begin
  select pg_get_functiondef(p.oid) into d from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'app_private' and p.proname = 'store_guard';
  if d is null then raise exception 'store_guard not found'; end if;
  if position($x$new.store = 'GVP'$x$ in d) = 0 then
    if position(anchor in d) = 0 then raise exception 'store_guard has no IBL rule: run inbox_tat.sql first'; end if;
    execute replace(d, anchor, ins || anchor);
  end if;
end $do$;
