-- Stock requirement form (store staff) and its KPI.
-- 1. The staff who fill the form are employees, so the store SRQ must be one of the stores an employee may write.
-- 2. The KPI "Daily Stock Requirement Form Completion %" (KPI-400) goes into the KPI library, and into the pack of Laxmi Vastralaya (lvsheor).
-- Run once. Safe to run again.

create or replace function app_private.emp_store(p text)
 returns boolean
 language sql
 immutable
 set search_path to ''
as $function$
  select p = any(array['LEAVES','AR','REGS','RH','ADV','MRATE','AUD','CT','KYC','SURV','TASKS','WFI','DEC','MTG','CHAL','RFL','BIL','CLF','EL','SVL','EVP','CCO','STKA','SUPT','AIS','AREQ',
    'FBT','CFB','ASG','TODO','DAILYT','SLP','SLASG','SLLOG','SLT','SLCERT','CREQ','XADV','XREP','XRES','XTRIP','UREQ','WISH','CHE','POLL','RECOG',
    'SRC.content','SRC.campaign','SRC.post','SRC.creview','SRC.ttest','SRC.audience','AUDIT','TDSD','IBL','GVP','JDACK','SRQ']) $function$;

insert into public.kpi_library (id, data, module, status)
select 'KPI-400',
 '{"id":"KPI-400","cat":"Store Operations","max":10,"freq":"Daily","name":"Daily Stock Requirement Form Completion %","level":"Data","method":"Auto","rule":"Daily Stock requirement form: on every working day the person sends a requirement (fast selling item, customer demand, new trend, refill) or presses Nothing to send today. A day with either counts. Score = max score × days with a form ÷ working days."}'::jsonb,
 'decision','released'
where not exists (select 1 from public.kpi_library where id='KPI-400');

insert into public.client_kpi_pack (client_id, kpi_id, enabled, max)
select c.id, 'KPI-400', true, 10 from public.clients c
where c.code='lvsheor' and not exists (select 1 from public.client_kpi_pack p where p.client_id=c.id and p.kpi_id='KPI-400');
