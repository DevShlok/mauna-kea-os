# API Routes — Index

All API routes live under `src/app/api/`. All apply rate limiting (`src/lib/rate-limit.ts`) and Zod input validation (`src/lib/api-guard.ts` + `src/lib/validations.ts`).

## AI / External APIs (High Cost)
| Route | Purpose | Rate Limit |
|---|---|---|
| `/api/generate-report` | Gemini: generate candidate report | 5/min |
| `/api/extract-profile` | Gemini: extract structured profile from text | 10/min |
| `/api/apify-linkedin` | Apify: scrape LinkedIn profile | 3/5 min |
| `/api/parse-cv` | Parse uploaded CV file | 10/min |

## File Uploads
| Route | Purpose |
|---|---|
| `/api/upload-cv` | Upload candidate CV to Supabase Storage → triggers Inngest |
| `/api/upload-linkedin-pdf` | Upload LinkedIn PDF |
| `/api/upload-profile-pic` | Upload candidate profile picture |
| `/api/upload-reference` | Upload reference document |
| `/api/view-file` | Serve a file from Supabase Storage (with auth check) |
| `/api/candidate-files` | List uploaded files for a candidate |

## Data Operations
| Route | Purpose |
|---|---|
| `/api/candidates` | Candidate data operations |
| `/api/candidate-details` | Detailed candidate fetch |
| `/api/mandates` | Mandate data operations |
| `/api/reports` | Candidate reports fetch/update |
| `/api/latest-report` | Fetch most recent report for a candidate |
| `/api/export-csv` | Export candidate data as CSV |

## Internal Operations
| Route | Purpose |
|---|---|
| `/api/time-logs` | Clock in/out (rate limited, auth required) |
| `/api/leave-requests` | Leave request management |
| `/api/auth` | Auth helpers |
| `/api/sync-candidates` | Backfill/sync route for updating candidate badges and pipeline status retroactively |

## Background / Automation
| Route | Purpose |
|---|---|
| `/api/inngest` | Inngest event handler (webhook endpoint) |
| `/api/cron/[job]` | Scheduled jobs — require `CRON_SECRET` header (fail-closed if env var not set) |

## See Also
- [[Architecture/rate-limiting]]
- [[Architecture/api-security]]
