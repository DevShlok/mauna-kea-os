# AI Workbench

**Route:** `/dashboard/workbench`
**Component:** `src/features/workbench/components/WorkbenchClient.tsx`
**API Routes:** `/api/generate-report`, `/api/extract-profile`, `/api/apify-linkedin`
**Tables:** [[Database/candidate_reports]], [[Database/frameworks]]

## What It Is
The AI Workbench allows consultants to generate structured candidate reports using Gemini. Reports are framework-based: the consultant selects a framework (which defines sections), and Gemini produces content for each section.

## Report Generation Flow
1. Consultant selects candidate + framework on workbench page
2. `/api/generate-report` called (rate limited: 5/min)
3. Gemini receives candidate data + framework sections as prompt
4. Response stored in `candidate_reports.reportData` (JSON)
5. `status` = `Generating → Completed | Failed`
6. `sharedWithClient` flag controls client portal visibility

## Strict Data Isolation
AI Workbench reports share the `candidate_reports` table with Manual Rubric Assessments (`frameworkId: 'rubric-assessment'`). It is critical that all AI Workbench operations (generate, fetch latest, delete) strictly filter by `frameworkId`. A past bug caused AI generation to indiscriminately delete manual assessments or leak assessment scores into AI forms. Workbench APIs must never touch `rubric-assessment` frameworks.

## Profile Extraction
`/api/extract-profile` — takes raw text (LinkedIn scrape or CV text), calls Gemini to extract structured fields, returns JSON for consultant to review before saving.

## LinkedIn Scraping
`/api/apify-linkedin` — triggers Apify actor for a LinkedIn URL. Returns profile data. Rate limited heavily (3/5min) due to cost.

## Framework System
See [[Database/frameworks]]. A framework defines `reportSections[]` — section names that Gemini fills in. Consultants manage frameworks at `/dashboard/frameworks`.

## Rate Limits
- `generate-report`: 5 req/min (expensive Gemini call)
- `extract-profile`: 10 req/min
- `apify-linkedin`: 3 req/5 min (~$0.10/run)

## See Also
- [[Architecture/integrations#Gemini (Google AI)]]
- [[Features/assessment-rubric]] — alternative to AI scoring
