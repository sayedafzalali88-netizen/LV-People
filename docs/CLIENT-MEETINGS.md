# Client Meetings

A separate small app for you (not for your LV People clients' staff). It records the discussion with a client, writes the transcript, a summary, and for every work area or focus area discussed, a strategy and a step-by-step plan.

Address after deploy: **https://lv-people.pages.dev/meetings/** (sign in with an LV People login whose e-mail is on the allowed list).

## What it does

1. **Add the discussion** in one of three ways: record in the browser (phone or laptop), upload a recording (mp3, m4a, wav, webm, up to 50 MB), or paste notes or a transcript.
2. **Transcript**: ElevenLabs Scribe turns the audio into text. It handles Hindi, English and Hinglish and separates the voices (Voice 0, Voice 1…). You name them ("Me", "Client").
3. **Summary & plan**: Claude writes:
   - Summary: headline, overview, client goals, key points, decisions, action items (who, by when), what you promised and what the client promised, concerns, open questions
   - Strategy: one card per focus area, with priority, objective, strategy, step-by-step plan (who, when), how to measure it, risks. Each step is marked **discussed** (said in the meeting) or **suggested** (expert suggestion to check with the client)
   - Plan: quick wins for the first 7 days, a phased roadmap, the agenda for the next meeting
   - A follow-up message for the client (copy, or send on WhatsApp)
   The output language is your choice for each meeting: Hinglish, English or Hindi.
4. Print / save as PDF, copy as text, your own notes, play the recording from any line of the transcript, make the summary again (for example after naming the voices).

If the page closes during a recording, the recording is kept on that device and offered again on the Meetings page.

## Parts

| Part | File |
|---|---|
| Screen | `app/meetings/index.html` (one page, does not touch LV People) |
| Database | `server/meetings.sql`: tables `meetings`, `meeting_members`, security rules, private bucket `meetings` |
| Server function | `supabase/functions/meeting-assistant/` (`index.ts` steps and checks, `analyse.ts` ElevenLabs + Claude, `analyse_test.ts`) |

**Security**: each person sees only their own meetings. Only e-mails in `meeting_members` can use the app. Recordings are in a private bucket in each person's own folder. The browser cannot write a transcript or summary; only the server function writes them. The API keys stay in Supabase secrets.

## Setup (one time)

1. **Database.** Supabase > SQL Editor > paste `server/meetings.sql` > Run (safe to run again). Then add yourself:
   ```sql
   insert into public.meeting_members (email, name) values ('your-login-email', 'Your name');
   ```
2. **ElevenLabs key.** elevenlabs.io > Developers > API keys > create a key with the Speech to Text permission.
3. **Secrets.** Supabase > Edge Functions > Secrets: add `ELEVENLABS_API_KEY`. `ANTHROPIC_API_KEY` is already there if the HR Assistant is set up (secrets are shared by all functions). Other settings and their defaults are in `supabase/functions/meeting-assistant/.env.example`.
4. **Function.** On your computer, in this repository:
   ```
   supabase functions deploy meeting-assistant
   ```
5. **Screen.** Push to the branch that Cloudflare Pages deploys; the page is in `app/meetings/`.

## Costs (approximate, check current prices)

- ElevenLabs Scribe: billed per hour of audio (see your ElevenLabs plan).
- Claude Opus 5.5 ($4 per million input tokens, $20 per million output tokens): a 1-hour meeting is about 15,000–25,000 tokens in and 6,000–12,000 out, plus thinking, so roughly ₹20–50 per meeting. To spend less, set `MEETING_LLM_EFFORT=medium` or `MEETING_LLM_MODEL=claude-sonnet-5-5`.

## Limits

- 50 MB per recording (the Supabase free-plan file limit). A browser recording uses about 15 MB per hour, so about 3 hours fit.
- Each step runs in the background of the server function. If a step shows "running" for more than 10 minutes, the page offers to start it again.
- The AI can mishear words or mix up voices. Read the summary before you share it; check every "suggested" step with the client.
- Always tell the client the meeting is being recorded and take their permission.
