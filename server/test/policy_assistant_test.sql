-- Local test only (NOT for Supabase): company, role and department filters, versions, archive, rate limit, RLS. Run after the stub and the migration; see docs/POLICY-ASSISTANT.md.
\set ON_ERROR_STOP 1
create or replace function pg_temp.v(i int) returns extensions.vector language sql as $$ select (array_fill(0::real, array[i-1]) || array[1::real] || array_fill(0::real, array[1024-i]))::extensions.vector $$;
insert into clients(id,code,name,modules) values ('a0000000-0000-0000-0000-000000000000','a','Company A','{policy}'),('b0000000-0000-0000-0000-000000000000','b','Company B','{policy}');
insert into employees(id,client_id,name,code,department_id) values ('ea000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000000','Emp A','E1','d1000000-0000-0000-0000-000000000000'),('eb000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000000','Emp B','E1',null);
insert into profiles values ('1a000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000000','ea000000-0000-0000-0000-000000000001','employee',true),
 ('2a000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000000',null,'hr',true),
 ('1b000000-0000-0000-0000-000000000000','b0000000-0000-0000-0000-000000000000','eb000000-0000-0000-0000-000000000001','employee',true);
-- A: leave policy (all), manager policy (managers only), sales policy (dept d2 only); B: its own leave policy
insert into policies(id,client_id,name,category,allowed_roles,allowed_department_ids) values
 ('aa000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000000','A Leave','Leave',default,'{}'),
 ('aa000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000000','A Manager Limits','Conduct','{manager,hr,admin}','{}'),
 ('aa000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000000','A Sales Incentive','Salary',default,'{d2000000-0000-0000-0000-000000000000}'),
 ('bb000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000000','B Leave','Leave',default,'{}');
insert into policy_versions(id,client_id,policy_id,version,file_path,file_name,file_type,status) select gen_random_uuid(),client_id,id,'v1','x','x.pdf','pdf','ready' from policies;
insert into policy_chunks(client_id,policy_id,version_id,chunk_no,content,embedding) select v.client_id,v.policy_id,v.id,1,'text of '||p.name,pg_temp.v(1) from policy_versions v join policies p on p.id=v.policy_id;
select policy_activate_version(id, null) from policy_versions;
\echo '--- employee of A (dept d1): expect only A Leave'
select policy_name, score from policy_match('a0000000-0000-0000-0000-000000000000','employee','d1000000-0000-0000-0000-000000000000',pg_temp.v(1));
\echo '--- manager of A (dept d1): expect A Leave + A Manager Limits'
select policy_name from policy_match('a0000000-0000-0000-0000-000000000000','manager','d1000000-0000-0000-0000-000000000000',pg_temp.v(1)) order by 1;
\echo '--- employee of A in dept d2: expect A Leave + A Sales Incentive'
select policy_name from policy_match('a0000000-0000-0000-0000-000000000000','employee','d2000000-0000-0000-0000-000000000000',pg_temp.v(1)) order by 1;
\echo '--- employee of B: expect only B Leave'
select policy_name from policy_match('b0000000-0000-0000-0000-000000000000','employee',null,pg_temp.v(1));
\echo '--- null client: expect nothing'
select count(*) from policy_match(null,'employee',null,pg_temp.v(1));
\echo '--- new version v2 for A Leave, processed (ready): live still v1, test sees both'
insert into policy_versions(id,client_id,policy_id,version,file_path,file_name,file_type,status) values ('ab000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000000','aa000000-0000-0000-0000-000000000001','v2','x','x.pdf','pdf','ready');
insert into policy_chunks(client_id,policy_id,version_id,chunk_no,content,embedding) values ('a0000000-0000-0000-0000-000000000000','aa000000-0000-0000-0000-000000000001','ab000000-0000-0000-0000-000000000002',1,'v2 text',pg_temp.v(1));
select version from policy_match('a0000000-0000-0000-0000-000000000000','employee',null,pg_temp.v(1));
select version from policy_match('a0000000-0000-0000-0000-000000000000','employee',null,pg_temp.v(1),8,true) order by 1;
select policy_activate_version('ab000000-0000-0000-0000-000000000002', null);
\echo '--- after publish v2: live = v2 only'
select version from policy_match('a0000000-0000-0000-0000-000000000000','employee',null,pg_temp.v(1));
select version, status from policy_versions where policy_id='aa000000-0000-0000-0000-000000000001' order by 1;
\echo '--- archive A Leave: nothing for employee'
select policy_set_archived('aa000000-0000-0000-0000-000000000001', true, null);
select count(*) from policy_match('a0000000-0000-0000-0000-000000000000','employee',null,pg_temp.v(1));
select policy_set_archived('aa000000-0000-0000-0000-000000000001', false, null);
select count(*) as after_restore from policy_match('a0000000-0000-0000-0000-000000000000','employee',null,pg_temp.v(1));
\echo '--- rate check'
insert into chat_sessions(id,client_id,user_id) values ('5e000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000000','1a000000-0000-0000-0000-000000000000');
insert into chat_messages(id,client_id,session_id,user_id,question,status) select gen_random_uuid(),'a0000000-0000-0000-0000-000000000000','5e000000-0000-0000-0000-000000000000','1a000000-0000-0000-0000-000000000000','q','answered' from generate_series(1,5);
select policy_rate_check('1a000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000000',5,0) as five_per_min, policy_rate_check('1a000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000000',6,5) as month_cap5, policy_rate_check('1a000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000000',6,100) as ok;
insert into chat_messages(id,client_id,session_id,user_id,question,status) values ('3e000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000000','5e000000-0000-0000-0000-000000000000','1a000000-0000-0000-0000-000000000000','mine','answered');
-- B session/message
insert into chat_sessions(id,client_id,user_id) values ('5b000000-0000-0000-0000-000000000000','b0000000-0000-0000-0000-000000000000','1b000000-0000-0000-0000-000000000000');
insert into chat_messages(id,client_id,session_id,user_id,question,status) values ('3b000000-0000-0000-0000-000000000000','b0000000-0000-0000-0000-000000000000','5b000000-0000-0000-0000-000000000000','1b000000-0000-0000-0000-000000000000','B secret','answered');
\echo '--- RLS as employee of A'
set role authenticated; set request.jwt.sub = '1a000000-0000-0000-0000-000000000000';
select count(*) as policies_visible from policies;
select count(*) as chunks_visible from policy_chunks;
select count(*) as my_msgs, count(*) filter (where question='B secret') as b_leak from chat_messages;
\echo '--- employee calling the search function directly (expect permission denied)'
do $$ begin perform policy_match('a0000000-0000-0000-0000-000000000000','admin',null,(array_fill(0::real,array[1024]))::extensions.vector); raise notice 'LEAK: search callable'; exception when insufficient_privilege then raise notice 'ok: permission denied'; end $$;
\echo '--- feedback: own message ok, B message refused, writes to chat_messages refused'
insert into chat_feedback(client_id,message_id,user_id,rating,created_by) values ('a0000000-0000-0000-0000-000000000000','3e000000-0000-0000-0000-000000000000','1a000000-0000-0000-0000-000000000000',1,'1a000000-0000-0000-0000-000000000000');
do $$ begin insert into chat_feedback(client_id,message_id,user_id,rating,created_by) values ('b0000000-0000-0000-0000-000000000000','3b000000-0000-0000-0000-000000000000','1a000000-0000-0000-0000-000000000000',1,'1a000000-0000-0000-0000-000000000000'); raise notice 'LEAK'; exception when insufficient_privilege then raise notice 'ok: refused'; end $$;
do $$ begin update chat_messages set answer='x'; raise notice 'LEAK'; exception when insufficient_privilege then raise notice 'ok: refused'; end $$;
update chat_feedback set rating=-1 where message_id='3e000000-0000-0000-0000-000000000000';
select rating from chat_feedback;
\echo '--- HR of A: sees A policies (4? no: 3) and all A messages, none of B'
set request.jwt.sub = '2a000000-0000-0000-0000-000000000000';
select count(*) as policies, count(*) filter (where client_id<>'a0000000-0000-0000-0000-000000000000') as foreign_rows from policies;
select count(*) as msgs, count(*) filter (where question='B secret') as b_leak from chat_messages;
\echo '--- employee of B sees nothing of A'
set request.jwt.sub = '1b000000-0000-0000-0000-000000000000';
select count(*) as a_msgs from chat_messages where client_id='a0000000-0000-0000-0000-000000000000';
select count(*) as policies from policies;
reset role;
\echo '--- claim job'
insert into policy_jobs(client_id,version_id) select client_id,id from policy_versions limit 1;
select stage,status,runs from policy_claim_job();
select count(*) as second_claim_empty from policy_claim_job();
