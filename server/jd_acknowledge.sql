-- Applied on 2026-11-13 (migration emp_store_add_jdack).
-- The JD and JS of every designation are kept in app_store as store "JD" (only HR writes it).
-- The acknowledgements are kept as store "JDACK": an employee may write his own, so the store joins the list of employee stores.
CREATE OR REPLACE FUNCTION app_private.emp_store(p text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select p = any(array['LEAVES','AR','REGS','RH','ADV','MRATE','AUD','CT','KYC','SURV','TASKS','WFI','DEC','MTG','CHAL','RFL','BIL','CLF','EL','SVL','EVP','CCO','STKA','SUPT','AIS','AREQ',
    'FBT','CFB','ASG','TODO','DAILYT','SLP','SLASG','SLLOG','SLT','SLCERT','CREQ','XADV','XREP','XRES','XTRIP','UREQ','WISH','CHE','POLL','RECOG',
    'SRC.content','SRC.campaign','SRC.post','SRC.creview','SRC.ttest','SRC.audience','AUDIT','TDSD','IBL','GVP','JDACK']) $function$;
-- The edge function "portal" (version 6) also returns a short JD and JS with each open vacancy for the career page.

-- The rule for JDACK is put into the existing guard (migration store_guard_jdack_rule), in front of the rule for IBL:
-- an employee may add only his own acknowledgement (key k:<his number>|<designation>|<version>), and it can never be changed.
do $do$
declare d text;
  anchor text := $a$  if new.store = 'IBL' then$a$;
  ins text := $ins$  if new.store = 'JDACK' then
    if split_part(substr(new.key,3),'|',1) !~ '^\d+$' or split_part(substr(new.key,3),'|',1)::int <> me or (n->>'emp') is distinct from me::text then raise exception 'Not allowed'; end if;
    if o is not null then raise exception 'An acknowledgement cannot be changed'; end if;
    return new;
  end if;
$ins$;
begin
  select pg_get_functiondef(p.oid) into d from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'app_private' and p.proname = 'store_guard';
  if d is null then raise exception 'store_guard not found'; end if;
  if position($x$new.store = 'JDACK'$x$ in d) = 0 then
    if position(anchor in d) = 0 then raise exception 'store_guard has no IBL rule to put the JDACK rule in front of'; end if;
    d := replace(d, anchor, ins || anchor);
    execute d;
  end if;
end $do$;
