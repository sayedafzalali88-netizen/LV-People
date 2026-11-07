-- Policy Assistant ("Policy Sahayak"): employees ask about company policy, the answer comes ONLY from the policies
-- their own company uploaded. Tables, security (RLS), search, rate limit and the background job queue.
-- Run once in Supabase > SQL Editor. Safe to run again. No existing table is changed.
-- Needs the extensions vector, pg_cron and pg_net (all available on Supabase; they are switched on below).

create extension if not exists vector with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- ---------------------------------------------------------------- tables
create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null check (length(trim(name)) between 2 and 150),
  category text not null default 'Other' check (category in ('Leave','Attendance','Salary','Conduct','Travel','Holiday','Benefits','Safety','IT','Exit','Other')),
  allowed_roles text[] not null default array['admin','hr','manager','employee'] check (allowed_roles <@ array['admin','hr','manager','employee'] and cardinality(allowed_roles) > 0),
  allowed_department_ids uuid[] not null default '{}',          -- empty = every department
  status text not null default 'draft' check (status in ('draft','active','archived')),  -- draft = no version published yet
  live_version_id uuid,                                          -- the version employees get answers from
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists policies_client_idx on public.policies (client_id, status);

create table if not exists public.policy_versions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  policy_id uuid not null references public.policies(id) on delete cascade,
  version text not null check (length(trim(version)) between 1 and 30),
  effective_date date,
  file_path text not null,
  file_name text not null,
  file_type text not null check (file_type in ('pdf','docx','txt')),
  file_size integer not null default 0,
  status text not null default 'processing' check (status in ('processing','ready','active','failed','superseded')),
  auto_publish boolean not null default true,                   -- publish as soon as it is processed; false = test first, then Publish
  pages integer not null default 0,
  ocr_pages integer not null default 0,
  chunks integer not null default 0,
  error text,
  processed_at timestamptz,
  published_at timestamptz,
  published_by uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists policy_versions_policy_idx on public.policy_versions (policy_id, created_at desc);
do $$ begin
  alter table public.policies add constraint policies_live_version_fk foreign key (live_version_id) references public.policy_versions(id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists public.policy_chunks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  policy_id uuid not null references public.policies(id) on delete cascade,
  version_id uuid not null references public.policy_versions(id) on delete cascade,
  chunk_no integer not null,
  heading text,
  page_from integer,
  page_to integer,
  content text not null,
  word_count integer not null default 0,
  embedding extensions.vector(1024),
  active boolean not null default false,                       -- true only for the published version of a policy that is not archived
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (version_id, chunk_no)
);
-- every search filters by company first; per company the number of chunks is small, so an exact scan is used (no approximate index that could miss a tenant's rows)
create index if not exists policy_chunks_client_idx on public.policy_chunks (client_id, active);
create index if not exists policy_chunks_version_idx on public.policy_chunks (version_id) where embedding is null;

-- text of each page while a version is being processed (deleted when the version is done)
create table if not exists public.policy_pages (
  version_id uuid not null references public.policy_versions(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  page_no integer not null,
  text text not null default '',
  source text not null default 'text' check (source in ('text','ocr','docx','txt')),
  need_ocr boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (version_id, page_no)
);

create table if not exists public.policy_jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  version_id uuid not null references public.policy_versions(id) on delete cascade,
  stage text not null default 'extract' check (stage in ('extract','ocr','chunk','embed','finish')),
  status text not null default 'queued' check (status in ('queued','running','done','failed')),
  runs integer not null default 0,
  errors integer not null default 0,
  locked_until timestamptz,
  last_error text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists policy_jobs_open_idx on public.policy_jobs (created_at) where status in ('queued','running');

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null,
  employee_id uuid,
  mode text not null default 'live' check (mode in ('live','test')),
  title text not null default '',
  last_at timestamptz not null default now(),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chat_sessions_user_idx on public.chat_sessions (user_id, last_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null,
  employee_id uuid,
  mode text not null default 'live' check (mode in ('live','test')),
  test_role text,
  question text not null,
  answer text not null default '',
  status text not null check (status in ('answered','not_found','out_of_scope','rejected','error')),
  sources jsonb not null default '[]',
  top_score real,
  model text,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chat_messages_client_idx on public.chat_messages (client_id, created_at desc);
create index if not exists chat_messages_session_idx on public.chat_messages (session_id, created_at);
create index if not exists chat_messages_user_idx on public.chat_messages (user_id, created_at desc);

create table if not exists public.unanswered_questions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  message_id uuid references public.chat_messages(id) on delete cascade,
  user_id uuid,
  employee_id uuid,
  question text not null,
  question_norm text not null,
  top_score real,
  reason text not null default 'not_found',
  resolved boolean not null default false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists unanswered_client_idx on public.unanswered_questions (client_id, created_at desc);

create table if not exists public.chat_feedback (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  user_id uuid not null,
  rating smallint not null check (rating in (-1, 1)),
  comment text check (length(comment) <= 500),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (message_id, user_id)
);

-- keeps updated_at current
create or replace function app_private.pa_touch() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at := now(); return new; end $$;
do $$ declare t text; begin
  foreach t in array array['policies','policy_versions','policy_chunks','policy_jobs','chat_sessions','chat_messages','unanswered_questions','chat_feedback'] loop
    execute format('drop trigger if exists pa_touch on public.%I', t);
    execute format('create trigger pa_touch before update on public.%I for each row execute function app_private.pa_touch()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- row level security
-- Writes go only through the server function "policy-assistant" (service role). The browser can only read what the rules below allow.
alter table public.policies enable row level security;
alter table public.policy_versions enable row level security;
alter table public.policy_chunks enable row level security;
alter table public.policy_pages enable row level security;
alter table public.policy_jobs enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.unanswered_questions enable row level security;
alter table public.chat_feedback enable row level security;

-- HR and Admin of the same company: policies, versions and the extracted text (to check what was read from the file)
drop policy if exists pa_pol_hr on public.policies;
create policy pa_pol_hr on public.policies for select to authenticated using (client_id = app_private.my_client() and app_private.is_hr());
drop policy if exists pa_ver_hr on public.policy_versions;
create policy pa_ver_hr on public.policy_versions for select to authenticated using (client_id = app_private.my_client() and app_private.is_hr());
drop policy if exists pa_chunk_hr on public.policy_chunks;
create policy pa_chunk_hr on public.policy_chunks for select to authenticated using (client_id = app_private.my_client() and app_private.is_hr());
-- policy_pages and policy_jobs: no rule, so no browser access at all

-- chats: everybody sees their own; HR and Admin see all chats of their company (Chat Logs)
drop policy if exists pa_sess_sel on public.chat_sessions;
create policy pa_sess_sel on public.chat_sessions for select to authenticated
  using (client_id = app_private.my_client() and (user_id = (select auth.uid()) or app_private.is_hr()));
drop policy if exists pa_msg_sel on public.chat_messages;
create policy pa_msg_sel on public.chat_messages for select to authenticated
  using (client_id = app_private.my_client() and (user_id = (select auth.uid()) or app_private.is_hr()));

drop policy if exists pa_unans_sel on public.unanswered_questions;
create policy pa_unans_sel on public.unanswered_questions for select to authenticated using (client_id = app_private.my_client() and app_private.is_hr());
drop policy if exists pa_unans_upd on public.unanswered_questions;
create policy pa_unans_upd on public.unanswered_questions for update to authenticated
  using (client_id = app_private.my_client() and app_private.is_hr()) with check (client_id = app_private.my_client() and app_private.is_hr());
revoke update on public.unanswered_questions from authenticated;
grant update (resolved, resolved_at, resolved_by) on public.unanswered_questions to authenticated;

-- feedback: a person rates only answers given to them
drop policy if exists pa_fb_sel on public.chat_feedback;
create policy pa_fb_sel on public.chat_feedback for select to authenticated
  using (client_id = app_private.my_client() and (user_id = (select auth.uid()) or app_private.is_hr()));
drop policy if exists pa_fb_ins on public.chat_feedback;
create policy pa_fb_ins on public.chat_feedback for insert to authenticated
  with check (user_id = (select auth.uid()) and created_by = (select auth.uid()) and client_id = app_private.my_client()
    and exists (select 1 from public.chat_messages m where m.id = message_id and m.user_id = (select auth.uid()) and m.client_id = chat_feedback.client_id));
drop policy if exists pa_fb_upd on public.chat_feedback;
create policy pa_fb_upd on public.chat_feedback for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and client_id = app_private.my_client());
revoke update on public.chat_feedback from authenticated;
grant update (rating, comment) on public.chat_feedback to authenticated;

-- ---------------------------------------------------------------- server-side functions (service role only)
-- The search (dropped first because its result columns may change between versions of this file). The company, role and department come from the server function, which reads them from the
-- signed-in person's own profile; nothing the browser sends is trusted. Company filter is on every table joined.
drop function if exists public.policy_match(uuid, text, uuid, extensions.vector, int, boolean);
create function public.policy_match(p_client uuid, p_role text, p_dept uuid, p_query extensions.vector, p_count int default 8, p_test boolean default false)
returns table (chunk_id uuid, policy_id uuid, version_id uuid, policy_name text, category text, version text, effective_date date,
               heading text, page_from int, page_to int, content text, version_status text, file_type text, score real)
language sql stable security definer set search_path = '' as $$
  select c.id, p.id, v.id, p.name, p.category, v.version, v.effective_date, c.heading, c.page_from, c.page_to, c.content, v.status, v.file_type,
         (1 - (c.embedding operator(extensions.<=>) p_query))::real
  from public.policy_chunks c
  join public.policy_versions v on v.id = c.version_id and v.client_id = p_client
  join public.policies p on p.id = c.policy_id and p.client_id = p_client
  where c.client_id = p_client
    and p_client is not null
    and c.embedding is not null
    and p.status <> 'archived'
    and p_role = any (p.allowed_roles)
    and (cardinality(p.allowed_department_ids) = 0 or p_dept = any (p.allowed_department_ids))
    and case when p_test
             then (c.active or v.status = 'ready')            -- Test Chat (HR only): published + processed but not yet published
             else (c.active and v.status = 'active' and p.live_version_id = v.id)
        end
  order by c.embedding operator(extensions.<=>) p_query
  limit least(greatest(coalesce(p_count, 8), 1), 20)
$$;

-- rate limit: 'ok', 'minute' (too many questions this minute) or 'month' (the company's monthly limit is used up)
create or replace function public.policy_rate_check(p_user uuid, p_client uuid, p_per_min int, p_month_cap int)
returns text language plpgsql stable security definer set search_path = '' as $$
declare n int;
begin
  select count(*) into n from public.chat_messages where user_id = p_user and created_at > now() - interval '1 minute';
  if p_per_min > 0 and n >= p_per_min then return 'minute'; end if;
  if p_month_cap > 0 then
    select count(*) into n from public.chat_messages where client_id = p_client and mode = 'live' and created_at >= date_trunc('month', now());
    if n >= p_month_cap then return 'month'; end if;
  end if;
  return 'ok';
end $$;

-- takes the next job that is not being worked on (a lease of 3 minutes; a crashed run is picked up again later)
create or replace function public.policy_claim_job() returns setof public.policy_jobs
language plpgsql security definer set search_path = '' as $$
begin
  return query
  update public.policy_jobs j set status = 'running', locked_until = now() + interval '180 seconds', runs = j.runs + 1
  where j.id = (select id from public.policy_jobs
                where status in ('queued','running') and (locked_until is null or locked_until < now())
                order by created_at for update skip locked limit 1)
  returning j.*;
end $$;

-- saves the embeddings of many chunks in one call
create or replace function public.policy_set_embeddings(p_ids uuid[], p_vectors text[]) returns void
language sql security definer set search_path = '' as $$
  update public.policy_chunks c set embedding = x.v::extensions.vector
  from unnest(p_ids, p_vectors) as x(id, v) where c.id = x.id
$$;

-- publishes a processed version: the old version's text stops being used, the new one is used from now on (one transaction)
create or replace function public.policy_activate_version(p_version uuid, p_by uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v record;
begin
  select * into v from public.policy_versions where id = p_version for update;
  if v.id is null then raise exception 'Version not found'; end if;
  if v.status not in ('ready','active') then raise exception 'This version is not ready (status %)', v.status; end if;
  perform 1 from public.policies where id = v.policy_id for update;
  update public.policy_chunks set active = false where policy_id = v.policy_id and version_id <> v.id and active;
  update public.policy_versions set status = 'superseded' where policy_id = v.policy_id and id <> v.id and status = 'active';
  update public.policy_chunks set active = true where version_id = v.id;
  update public.policy_versions set status = 'active', published_at = now(), published_by = p_by where id = v.id;
  update public.policies set live_version_id = v.id, status = 'active', updated_by = p_by where id = v.policy_id;
end $$;

-- archive: nobody gets answers from it any more; restore brings back the published version
create or replace function public.policy_set_archived(p_policy uuid, p_archived boolean, p_by uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare p record;
begin
  select * into p from public.policies where id = p_policy for update;
  if p.id is null then raise exception 'Policy not found'; end if;
  if p_archived then
    update public.policy_chunks set active = false where policy_id = p.id and active;
    update public.policies set status = 'archived', updated_by = p_by where id = p.id;
  else
    if p.live_version_id is not null then
      update public.policy_chunks set active = true where version_id = p.live_version_id;
      update public.policies set status = 'active', updated_by = p_by where id = p.id;
    else
      update public.policies set status = 'draft', updated_by = p_by where id = p.id;
    end if;
  end if;
end $$;

do $$ declare f text; begin
  foreach f in array array[
    'public.policy_match(uuid, text, uuid, extensions.vector, int, boolean)',
    'public.policy_rate_check(uuid, uuid, int, int)',
    'public.policy_claim_job()',
    'public.policy_set_embeddings(uuid[], text[])',
    'public.policy_activate_version(uuid, uuid)',
    'public.policy_set_archived(uuid, boolean, uuid)'] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

-- the browser must not write these tables directly (only the server function does)
revoke insert, update, delete on public.policies, public.policy_versions, public.policy_chunks, public.policy_pages, public.policy_jobs,
  public.chat_sessions, public.chat_messages from anon, authenticated;
revoke all on public.policy_pages, public.policy_jobs from anon, authenticated;
revoke insert, delete on public.unanswered_questions from anon, authenticated;
revoke delete on public.chat_feedback from anon, authenticated;
revoke all on public.policies, public.policy_versions, public.policy_chunks, public.chat_sessions, public.chat_messages,
  public.unanswered_questions, public.chat_feedback from anon;

-- ---------------------------------------------------------------- file storage (private; files are read only by the server function)
insert into storage.buckets (id, name, public, file_size_limit)
values ('policies', 'policies', false, 20971520)
on conflict (id) do update set public = false, file_size_limit = 20971520;

-- ---------------------------------------------------------------- background processing
-- The upload starts the work at once. This schedule is the safety net: every minute, if a job is waiting
-- (for example after a timeout), it wakes the server function again. The secret is kept in the Supabase Vault:
--   select vault.create_secret('<the same value as POLICY_CRON_SECRET>', 'policy_cron_secret');
select cron.schedule('policy-assistant-jobs', '* * * * *', $cron$
  select net.http_post(
    url := 'https://okhikmjugdytahgnddjm.supabase.co/functions/v1/policy-assistant',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'policy_cron_secret' limit 1)),
    body := '{"action":"process"}'::jsonb)
  where exists (select 1 from public.policy_jobs where status in ('queued','running') and (locked_until is null or locked_until < now()))
$cron$);
