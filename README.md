# Mauna Kea OS

> Internal operating system for **Mauna Kea International** — an executive search & advisory firm. Combines a full-featured ATS, mandate pipeline, client portal, candidate portal, AI assessment workbench, and team operations into a single platform.

---

## Features

### Mandate & Pipeline Management
- Create and manage executive search mandates with target roles, CTC bands, timelines, and geographies
- Kanban-style pipeline tracking across stages: Universe → Mapping → Longlist → Shortlist → Interview → Offer → Placed
- Drag-and-drop candidate reordering within mandates
- Mandate-level analytics and stage conversion tracking

### Candidate Database
- Searchable, filterable candidate CRM with 50+ fields (experience, CTC, qualifications, relocation, stability)
- AI-powered CV parsing — drop a PDF, DOCX, or image and automatically populate the candidate profile
- LinkedIn PDF upload with AI extraction
- Apify-based LinkedIn profile scraping directly into the candidate record
- Candidate deduplication, status tracking, and audit logs

### Float List
- Submit (float) candidates to clients with one click from the pipeline
- Track follow-ups, reference checks, and float-level activity timelines
- Consultant-to-client visibility controls

### Client Portal (`/[clientSlug]`)
- Dedicated portal per client company, accessible via unique slug URLs
- Clients can view floated candidates, leave remarks, and track shortlist progress
- Role-gated: only users assigned `role=client` with the matching `linkedClientId` can access

### Candidate Portal (`/[candidateSlug]`)
- Dedicated portal per candidate for onboarding, profile completion, and offer tracking
- Multi-step onboarding flow: LinkedIn upload → AI profile extraction → profile review
- In-app notifications for application status updates

### AI Assessment Workbench
- Build custom scoring frameworks (categories + weighted criteria)
- Generate AI assessment reports from interview transcripts, notes, and reference documents
- Automated candidate scoring using Google Gemini with a 6-model fallback chain
- PDF export of structured assessment reports with `jsPDF` + `html2canvas-pro`

### Analytics
- Live KPI dashboard: active mandates, placed candidates, pipeline conversion rates, average CTC

### Team Operations
- Time log management for consultants
- Leave request tracking
- Call log management

### Admin Panel
- User management with 4-tier RBAC: `admin`, `consultant`, `client`, `candidate`
- Bulk import of candidates, clients, and mandates via AI-assisted CSV column mapping
- Engagement list management
- Trash recovery (soft-delete with 30-day expiry)

---

## Tech Stack

### Framework
| | |
|---|---|
| **Next.js 16.2** | App Router + Turbopack, Server Components, Server Actions |
| **React 19** | UI layer |
| **TypeScript 5** | End-to-end type safety |
| **Tailwind CSS v4** | Utility-first styling |

### Database & Auth
| | |
|---|---|
| **Supabase** | PostgreSQL database (Mumbai region) + Auth (email/password, Google OAuth) + File Storage |
| **Drizzle ORM 0.45** | Type-safe query builder and schema migrations |
| **postgres.js 3** | Low-level PostgreSQL driver |
| **@supabase/ssr** | Server-side session management (PKCE flow, cookie-based) |

### AI & Integrations
| | |
|---|---|
| **Google Gemini** | Core AI model via Vercel AI SDK (`@ai-sdk/google`) |
| **Vercel AI SDK 6** | `generateObject` / `generateText` with structured Zod schemas |
| **Apify** | LinkedIn profile scraping (`apify-client`) |
| **Resend** | Transactional email from `maunakea.co.in` domain |
| **Google Apps Script** | Webhook for logging contact form submissions to Google Sheets + Drive |
| **Inngest** | Durable background jobs for CV processing pipelines |

### Document Processing
| | |
|---|---|
| **pdf-parse-new** | PDF → text extraction |
| **mammoth** | DOCX → text extraction |
| **compromise** | Local NLP entity extraction (names, dates, roles) |
| **jsPDF + html2canvas-pro** | Client-side PDF report generation |
| **xlsx + file-saver** | Excel export of candidate data |

### Infrastructure
| | |
|---|---|
| **Vercel** | Hosting, serverless functions, cron jobs |
| **Vercel Analytics + Speed Insights** | Real-user metrics and Core Web Vitals |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/          # Internal OS (admin/consultant view)
│   │   ├── candidates/     # Candidate database
│   │   ├── mandates/       # Mandate pipeline
│   │   ├── float-list/     # Float submissions
│   │   ├── clients/        # Client management
│   │   ├── frameworks/     # Assessment frameworks
│   │   ├── workbench/      # AI assessment workbench
│   │   ├── analytics/      # KPI dashboard
│   │   ├── team/           # Time logs, leave requests
│   │   └── admin/          # User & system admin
│   ├── [clientSlug]/       # Client portal (per-company)
│   ├── [candidateSlug]/    # Candidate portal (per-candidate)
│   ├── sign-in/            # Auth pages
│   └── api/                # API routes (file upload, AI, webhooks, cron)
├── actions/                # Next.js Server Actions (CRUD mutations)
├── features/               # Feature-sliced UI components
├── components/             # Shared reusable UI components
├── db/
│   ├── schema.ts           # Drizzle table definitions (21 tables)
│   ├── queries.ts          # Complex read queries
│   └── index.ts            # DB connection (postgres.js + Drizzle)
├── lib/
│   ├── auth.ts             # requireRole() RBAC guard
│   ├── gemini-fallback.ts  # 6-model AI fallback chain
│   ├── inngest/            # Background job functions
│   └── parser/             # CV text extraction (PDF/DOCX/image)
├── hooks/                  # Client-side React hooks
├── utils/                  # Shared utility functions
└── scripts/                # One-off DB maintenance scripts (tsx)
```

---

## Role-Based Access Control

The platform uses a 4-tier RBAC model enforced server-side on every Server Action and API route via `requireRole()` in `src/lib/auth.ts`.

| Role | Access |
|---|---|
| `admin` | Full platform access — all features + user management |
| `consultant` | Internal OS — mandates, candidates, floats, workbench |
| `client` | Client portal only (`/[clientSlug]`) — view floated candidates, leave remarks |
| `candidate` | Candidate portal only (`/[candidateSlug]`) — profile, onboarding, notifications |

Client users are linked via `linkedClientId` and candidates via `linkedCandidateId` in the `platform_users` table.

---

## Local Development

### 1. Clone
```bash
git clone https://github.com/DevShlok/mauna-kea-os.git
cd mauna-kea-os
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment variables
Create a `.env.local` file at the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database (Supabase Pooler URL — use with ?prepare=false)
DATABASE_URL=postgres://postgres.xxx:password@aws-1-region.pooler.supabase.com:6543/postgres?sslmode=require

# Google Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Apify (LinkedIn scraping)
APIFY_API_TOKEN=your_apify_token

# Resend (transactional email)
RESEND_API_KEY=your_resend_api_key

# Google Apps Script webhook (contact form → Sheets + Drive)
NEXT_PUBLIC_GOOGLE_WEBHOOK_URL=your_google_apps_script_url

# Inngest (background jobs)
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

### 4. Push database schema
```bash
npx drizzle-kit push
```

### 5. Start the dev server
```bash
npm run dev
```

To also run the Inngest dev server for background jobs:
```bash
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Deployment

The application is deployed on **Vercel**. All file processing uses in-memory `Buffer` parsing — no local disk writes — making it fully serverless-compatible.

Two cron jobs run automatically via Vercel Cron (configured in `vercel.json`):
- `0 0 * * *` — Clean up trash (hard-delete soft-deleted records older than 30 days)
- `0 9 * * *` — Nudge stale float follow-ups

To deploy:
1. Connect the repository to Vercel
2. Add all `.env.local` variables to Vercel's Environment Variables settings
3. Deploy — no build configuration needed

---

## License

Proprietary — Mauna Kea International. All rights reserved.
