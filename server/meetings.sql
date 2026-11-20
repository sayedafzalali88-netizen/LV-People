-- Client Meetings (separate app at /meetings/): record a client discussion, transcript, summary, strategy and plan.
-- Run once in Supabase > SQL Editor. Safe to run again. Nothing of LV People is changed.
-- Only e-mails listed in meeting_members can use the app; each person sees only their own meetings.

create table if not exists public.meeting_members (
  email      text primary key check (email = lower(email)),
  name       text,
  created_at timestamptz not null default now()
);
alter table public.meeting_members enable row level security;
-- no browser policies: the list is managed only in the SQL Editor / Table Editor

create or replace function public.is_meeting_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.meeting_members m where m.email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke all on function public.is_meeting_member() from public, anon;
grant execute on function public.is_meeting_member() to authenticated;

create table if not exists public.meetings (
  id              uuid primary key default gen_random_uuid(),
  owner           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_name     text not null check (length(client_name) between 1 and 200),
  title           text not null default '' check (length(title) <= 300),
  meeting_date    date not null default current_date,
  out_lang        text not null default 'hinglish' check (out_lang in ('en', 'hinglish', 'hi')),
  context         text not null default '' check (length(context) <= 5000),     -- background about the client, typed by you
  agenda          text not null default '' check (length(agenda) <= 3000),      -- agenda points, one per line (optional)
  source          text not null default 'audio' check (source in ('audio', 'text')),
  audio_path      text,                                                          -- meetings bucket: <owner>/<id>.<ext>
  duration_sec    integer,
  status          text not null default 'new'
                  check (status in ('new', 'transcribing', 'transcribed', 'analysing', 'done', 'failed')),
  error           text,
  transcript      jsonb,            -- [{speaker, start, end, text}]
  transcript_text text,             -- pasted text, or the joined transcript
  speakers        jsonb not null default '{}'::jsonb,   -- {"speaker_0": "Me", "speaker_1": "Client"}
  lang_detected   text,
  summary         jsonb,            -- summary + focus areas + strategy + plan (see the server function)
  model           text,
  notes           text not null default '',
  input_tokens    integer,
  output_tokens   integer,
  stt_seconds     integer,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.meetings add column if not exists agenda text not null default '' check (length(agenda) <= 3000);  -- for databases made before the agenda field
create index if not exists meetings_owner_date on public.meetings (owner, meeting_date desc, created_at desc);

alter table public.meetings enable row level security;
drop policy if exists meetings_select on public.meetings;
drop policy if exists meetings_insert on public.meetings;
drop policy if exists meetings_update on public.meetings;
drop policy if exists meetings_delete on public.meetings;
create policy meetings_select on public.meetings for select to authenticated using (owner = auth.uid() and public.is_meeting_member());
create policy meetings_insert on public.meetings for insert to authenticated
  with check (owner = auth.uid() and public.is_meeting_member() and status = 'new' and summary is null and transcript is null);
create policy meetings_update on public.meetings for update to authenticated
  using (owner = auth.uid() and public.is_meeting_member()) with check (owner = auth.uid());
create policy meetings_delete on public.meetings for delete to authenticated using (owner = auth.uid() and public.is_meeting_member());

-- the browser may change only these columns; status, transcript and results are written by the server function
revoke update on public.meetings from authenticated;
grant select, insert, delete on public.meetings to authenticated;
grant update (client_name, title, meeting_date, out_lang, context, agenda, speakers, notes, audio_path, duration_sec, transcript_text, source)
  on public.meetings to authenticated;

create or replace function public.meetings_touch() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists meetings_touch on public.meetings;
create trigger meetings_touch before update on public.meetings for each row execute function public.meetings_touch();

-- private bucket for the recordings: each person reads and writes only the folder named after their own user id
insert into storage.buckets (id, name, public, file_size_limit)
values ('meetings', 'meetings', false, 52428800)        -- 50 MB per file (the Supabase free-plan limit)
on conflict (id) do update set public = false;

drop policy if exists meetings_audio_insert on storage.objects;
drop policy if exists meetings_audio_select on storage.objects;
drop policy if exists meetings_audio_delete on storage.objects;
drop policy if exists meetings_audio_update on storage.objects;
create policy meetings_audio_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'meetings' and (storage.foldername(name))[1] = auth.uid()::text and public.is_meeting_member());
create policy meetings_audio_select on storage.objects for select to authenticated
  using (bucket_id = 'meetings' and (storage.foldername(name))[1] = auth.uid()::text and public.is_meeting_member());
create policy meetings_audio_update on storage.objects for update to authenticated
  using (bucket_id = 'meetings' and (storage.foldername(name))[1] = auth.uid()::text and public.is_meeting_member())
  with check (bucket_id = 'meetings' and (storage.foldername(name))[1] = auth.uid()::text);
create policy meetings_audio_delete on storage.objects for delete to authenticated
  using (bucket_id = 'meetings' and (storage.foldername(name))[1] = auth.uid()::text and public.is_meeting_member());

-- Add yourself (and anyone else who may use the app) with the e-mail of their Supabase login:
-- insert into public.meeting_members (email, name) values ('you@example.com', 'Your name') on conflict do nothing;
