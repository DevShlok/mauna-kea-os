# Integrations

## Supabase
- **Auth:** JWTs, email/password + Google OAuth. Server client: `src/utils/supabase/server.ts`. Client: `src/utils/supabase/client.ts`.
- **Storage:** Supabase Storage buckets for CVs, LinkedIn PDFs, profile pictures. Uploads use service role key server-side to bypass RLS.
- **Database:** PostgreSQL via Drizzle ORM (not Supabase's own JS client for DB queries).
- **RLS:** Row Level Security enabled; see `drizzle/0001_fix_indexes_and_rls.sql`.
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Gemini (Google AI)
- Used by: `/api/generate-report`, `/api/extract-profile`
- Model: Gemini (via `@google/genai` or REST)
- `GEMINI_API_KEY` env var — never exposed to client
- Rate limited: 5/min on report generation, 10/min on extract
- Fallback: `src/lib/gemini-fallback.ts` handles API errors gracefully

---

## Resend
- Transactional email for nudge notifications, reference check invitations
- Env var: `RESEND_API_KEY`
- Used in server actions / API routes only

---

## Apify
- LinkedIn profile scraping via Apify actors
- Route: `/api/apify-linkedin`
- Rate limited: 3 req / 5 min (expensive per call ~$0.10)
- Env var: `APIFY_API_TOKEN`

---

## Inngest
- Background job queue. See [[Architecture/background-jobs]] for full detail.
- Env vars: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`

---

## jsPDF
- Installed (`"jspdf": "^4.2.1"`). Used for PDF generation (Phase 4: assessment report download).
- No additional installation needed for Phase 4.
