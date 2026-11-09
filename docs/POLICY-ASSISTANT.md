# HR Assistant

Employees ask about company policy in a chat. The answer comes **only** from the policies their own company uploaded. No general knowledge, no labour law, no guessing.

## Two sources, kept apart for many clients

| Source | Stored | Who gets it |
|---|---|---|
| Company policies | `policy_chunks`, one set **per company** (`client_id`) | only that company, filtered by role and department |
| LV People User Guide (`app/guide/g*.js`) | `guide_chunks`, **one copy for all companies** (no `client_id`) | every company, but only the entries of the modules that company has (`clients.modules`), and only the entries the person's role may open (HR-only entries: Admin and HR) |

On every question the server searches both, using the company, modules, role and department from the signed-in person's own profile. The AI is told that company rules (days, rupees, %) come **only** from the company policy, and that the guide only explains how to use the software. The source chip shows 📄 for a policy and 📘 for the guide; "Open in User Guide" opens that entry in the app.

**KPI reference.** Besides the guide pages, the index holds one short entry for every KPI of the KPI library (`app/kpiguide.js`, about 400): the KPI number, name, frequency, maximum score, how it is scored (from its method and rule) and what to do to score well (from what the rule measures, nothing added by hand). A company gets the KPIs of its own modules. They are for the HR Assistant only and are not shown in the User Guide pages. A question such as "KPI-277 kaise kaam karti hai" or "KPI-277 me acha score kaise laun" finds the entry of that KPI. After a change in a KPI rule, re-index the User Guide.

**When the guide changes** (after a deploy with new `g*.js` text): sign in as the platform admin > **Clients (live)** > card "HR Assistant · LV People User Guide" > **Re-index User Guide**. The card says "Guide changed: re-index needed" when the guide in the app differs from the indexed one. The new version is written completely first and then switched in one step; questions keep using the old version until then. Platform-only pages (Licensing, Clients, KPI library and packs, Enquiries) are never indexed.

## What was added (nothing existing was changed)

| Part | File | What it does |
|---|---|---|
| Database | `server/policy_assistant.sql` | 11 new tables (9 for policies and chats, 2 for the guide), security rules (RLS), search, rate limit, job queue, private file bucket, a schedule every minute |
| Server function | `supabase/functions/policy-assistant/` | upload, text extraction (PDF, DOCX, TXT, OCR for scanned PDFs), chunks, embeddings, search, answer, admin actions |
| Screens | `app/policy.js` | Policy Management (Admin, HR) and the HR Assistant chat button on every page |
| Guide | `app/guide/g9.js` | User Guide chapter (EN + HI) |
| Small edits | `app/index.html` (1 line: `policy.js`, 1 script: `g9.js`), `app/live.js` (`'policy'` added to the module list and to the live pages) | |

To switch the module off: remove `<script src="policy.js"></script>` from `app/index.html`, or untick the module for the company.

## How it works

```
Upload (HR) → file in private storage → job queue → text per page (OCR for scanned pages)
  → chunks of 300–500 words (≈50 words overlap) with policy, heading, page → embeddings (Voyage voyage-3.5, 1024) → pgvector
Question (employee) → login check → rate limit → embeddings of the question (+ an English search line)
  → search ONLY in: this company + this role + this department + published versions
  → best score < POLICY_MIN_SCORE?  → fixed "jaankari uplabdh nahi" answer, NO AI call
  → best 4–6 parts → Claude (strict prompt, JSON output) → check: source given? numbers written in the policy? → answer + source
```

**Security**
- Company: every table has `client_id`. The search function takes the company, role and department from the signed-in person's own profile on the server, and filters on every joined table. It cannot be called from the browser.
- Role and department: each policy has `allowed_roles` and `allowed_department_ids`. A manager-only policy is never searched for an employee.
- Login: every request checks the Supabase login. Writes happen only on the server. The browser can read only its own chats (HR: chats of its own company).
- Rate limit: `POLICY_RATE_PER_MIN` per employee, `POLICY_MONTHLY_CAP` per company.
- Files: private bucket `policies`. HR gets a 10-minute download link through the server.

**Answer rules**
- (a) Threshold: below `POLICY_MIN_SCORE` the AI is not called.
- (b) 4–6 parts go to the AI (`POLICY_TOP_K`). Claude Haiku 5.5 does not accept a `temperature` setting (the API returns an error), so it is not sent. Strictness comes from (a), the prompt, the JSON format and the checks in (d).
- (c) The system prompt is the one you gave, plus the JSON format.
- (d) An answer with no valid source is rejected and replaced by "jaankari uplabdh nahi". Extra check: every number in the answer (days, rupees, %) must be written in the policy parts the answer used, otherwise the answer is rejected.
- Out-of-policy questions (general knowledge, own salary calculation, other employees) get a polite refusal.

## Setup (one time, about 20 minutes)

You need: the Supabase project (already used by LV People), a Claude API key, a Voyage AI key, and the Supabase CLI on your computer.

1. **Database.** Supabase > SQL Editor > paste `server/policy_assistant.sql` > Run. It is safe to run again. It also makes the random secret of the background job in the Vault.
2. **Function secrets.** Supabase > Edge Functions > Secrets, add:
   - `ANTHROPIC_API_KEY` = your Claude key
   - `VOYAGE_API_KEY` = your Voyage key

   Other settings are optional; see `supabase/functions/policy-assistant/.env.example` for every name and default.
3. **Deploy the function** from the repository folder:
   ```bash
   supabase functions deploy policy-assistant --project-ref okhikmjugdytahgnddjm --no-verify-jwt
   ```
   `--no-verify-jwt` is needed because the minute schedule has no user login. The function checks the login itself on every user request.
4. **Front end.** Push the branch; Cloudflare Pages publishes `app/` as before.
5. **Switch the module on for a company.** Platform admin: Clients (live) > the company > Modules > tick `policy` > Save.
6. **Check.** Sign in as HR of a test company > Administration > Policy Management > Upload a small policy > wait for Active > Test Chat.

## Settings (`.env` of the function)

| Name | Default | Meaning |
|---|---|---|
| `ANTHROPIC_API_KEY` | (required) | Claude API key |
| `VOYAGE_API_KEY` | (required) | Voyage AI key (embeddings) |
| `POLICY_CRON_SECRET` | (made by the SQL file in the Vault) | protects the background-job call; set it only to override the Vault value |
| `POLICY_LLM_MODEL` | `claude-haiku-5-5` | model that writes answers |
| `POLICY_OCR_MODEL` | `claude-haiku-5-5` | model that reads scanned pages |
| `EMBEDDING_PROVIDER` / `EMBEDDING_MODEL` | `voyage` / `voyage-3.5` | or `openai` / `text-embedding-3-small` (+ `OPENAI_API_KEY`). Size is fixed at 1024. If you change the provider, upload the policies again (New version) so old and new embeddings are not mixed. |
| `POLICY_MIN_SCORE` | `0.45` | similarity threshold |
| `POLICY_TOP_K` | `5` | parts sent to the AI (4–6) |
| `POLICY_QUERY_REWRITE` | `on` | also search with an English line made from a Hindi/Hinglish question. Used for search only, never as the answer. This is a small Haiku call (about ₹0.01) made before the score is known; `off` removes it. |
| `POLICY_OCR` | `on` | OCR for scanned PDF pages |
| `POLICY_RATE_PER_MIN` | `5` | questions per employee per minute |
| `POLICY_MONTHLY_CAP` | `3000` | questions per company per month (0 = no limit) |
| `POLICY_MAX_FILE_MB` / `POLICY_MAX_PAGES` | `20` / `300` | file limits |
| `POLICY_ALLOWED_ORIGINS` | `*` | browser origins allowed to call the function |

**Tuning the threshold.** Test Chat shows the best match score for each question. Ask 10 questions the policy answers and 10 it does not. Set `POLICY_MIN_SCORE` between the two groups. If right answers get "jaankari uplabdh nahi", lower it a little (for example 0.40). If unrelated questions reach the AI, raise it. The AI and the source check still stop wrong answers above the threshold.

## Testing checklist

Use a test company. Run the automatic tests first:

```bash
deno test --allow-read --allow-env --allow-net supabase/functions/policy-assistant/
```

Then in the app:

| # | Test | Steps | Expected |
|---|---|---|---|
| a | Answer from the policy | Upload a Leave policy that says "12 days of Casual Leave". Employee asks "CL kitni milti hai?" | The answer says 12, the source chip shows the policy name + section/page, and the chip opens that text |
| b | Question outside the policy | Ask "Mera PF kitna katega?" (not in the policy) and "Bharat ki rajdhani kya hai?" | "Is vishay par company policy me jaankari uplabdh nahi hai. Kripya HR vibhag se sampark karein." for the first; a polite refusal for the second. The first one appears in Unanswered Questions |
| c | Company A vs Company B | Upload a policy with a unique rule (for example "Diwali bonus 5000") in Company B. Sign in as an employee of Company A and ask about it | Company A gets "jaankari uplabdh nahi". Chat Logs of A do not show B's chats |
| d | Manager-only policy | Upload "Manager Approval Limits" with roles Manager, HR, Admin. Ask as Employee (and in Test Chat with "Ask as: Employee") | Employee: "jaankari uplabdh nahi". Manager: the answer with the source |
| e | Hindi question, English policy | Ask "आकस्मिक अवकाश कितने दिन का मिलता है?" about the English Leave policy | The answer is in Hindi, says 12, with the English policy as the source |
| f | New version | Upload v2 with "14 days". Wait for Active | The answer now says 14; the View window shows v1 as Replaced |
| g | Scanned PDF | Upload a scanned (photo) PDF | Status goes Processing → Active; View shows "(n OCR)" and the text read |
| h | Rate limit | Ask 6 questions within one minute | The 6th says "Please wait a minute" |
| i | Archive | Archive the Leave policy, ask again | "jaankari uplabdh nahi" |

Tests (c), (d), the company filter, role filter, department filter, publish/replace, archive, feedback rules and the rate limit were also run on a local PostgreSQL 16 with pgvector. To run them again (on a throw-away local database, never on Supabase):

```bash
createdb pa_test
psql -d pa_test -f server/test/policy_assistant_stub.sql
sed '/pg_net\|pg_cron;/d' server/policy_assistant.sql | psql -d pa_test
psql -d pa_test -f server/test/policy_assistant_test.sql
```

## Running cost (approximate, Claude Haiku 5.5)

Per question about ₹0.05 (answer + English search line + embeddings). 100 employees × 10 questions a month ≈ ₹55–60. A scanned page costs about ₹0.05 once, at upload. Supabase: no extra plan is needed.
