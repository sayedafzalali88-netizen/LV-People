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
