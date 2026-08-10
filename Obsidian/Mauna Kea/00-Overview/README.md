# Mauna Kea OS — Knowledge Base

Mauna Kea OS is the internal operating system for **Mauna Kea**, an executive search firm. It covers three distinct portals, all within a single Next.js 15 App Router codebase.

## Three Portals

| Portal | Route prefix | Who uses it |
|---|---|---|
| Internal OS / Consultant dashboard | `/dashboard/*` | Admins & consultants |
| Client portal | `/[clientSlug]/*` (when slug resolves to a client) | Hiring managers at client companies |
| Candidate portal | `/[clientSlug]/*` (when slug resolves to a candidate) | Executive candidates |

## Vault Structure

- [[Database/index|Database]] — one note per DB table
- [[Architecture/index|Architecture]] — auth, RBAC, integrations, background jobs
- [[Features/index|Features]] — one note per product feature area
- [[API/index|API]] — one note per API route group
- [[Decisions/index|Decisions]] — ADR-style decision records
- [[Changelog]] — running log of changes

## Key Technology
- **Next.js 15** (App Router, Server Components, Server Actions)
- **Drizzle ORM** on **PostgreSQL** (Supabase)
- **Supabase Auth** (email/password + Google OAuth)
- **Inngest** — background job queue (CV processing, AI pipelines)
- **Gemini** (Google) — AI report generation, CV extraction
- **Resend** — transactional email
- **Apify** — LinkedIn scraping
- **Zod** — runtime schema validation on all API routes
- **jsPDF** — PDF generation
- **Vercel** — deployment

## BRD Phase Status
- Phase 0: Complete — baseline stability & consultant profile editor
- Phase 1: Complete — candidate portal v1 (onboarding, jobs, dream companies)
- Phase 2: Complete — manual rubric assessment system (A/B/C tier)
- Phase 3: Planned — tier gating, guidance notes, job recommendations
- Phase 4: Planned — membership tiers, mentorship marketplace, PDF download
- Phase 5–6: Future
