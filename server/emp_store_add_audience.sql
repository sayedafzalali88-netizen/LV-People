-- Lets employees save their own Audience figures (KPI-277 followers, KPI-267 website visits).
-- Run once in Supabase > SQL Editor. Safe to run again.
create or replace function app_private.emp_store(p text) returns boolean language sql immutable set search_path = '' as $$
  select p = any(array['LEAVES','AR','REGS','RH','ADV','MRATE','AUD','CT','KYC','SURV','TASKS','WFI','DEC','MTG','CHAL','RFL','BIL','CLF','EL','SVL','EVP','CCO','STKA','SUPT','AIS','AREQ',
    'FBT','CFB','ASG','TODO','DAILYT','SLP','SLASG','SLLOG','SLT','SLCERT','CREQ','XADV','XREP','XRES','XTRIP','UREQ','WISH','CHE','POLL','RECOG',
    'SRC.content','SRC.campaign','SRC.post','SRC.creview','SRC.ttest','SRC.audience','AUDIT','TDSD']) $$;
