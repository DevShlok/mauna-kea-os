# Background Jobs (Inngest)

**Files:** `src/lib/inngest/client.ts`, `src/lib/inngest/functions.ts`
**Route:** `src/app/api/inngest/route.ts`

## Why Inngest
CV processing (PDF extraction + entity parsing + Supabase storage write) can take 5–30 seconds. Doing this synchronously in an API route would time out on Vercel (10s limit on hobby tier). Inngest handles retry, durability, and step-level failure recovery.

## Functions Defined

### `processGdriveCv` (`cv.process_gdrive_link`)
**Trigger event:** `cv.process_gdrive_link` with `{ candidateId, gdriveUrl }`

Steps:
1. Download PDF from Google Drive public URL
2. Extract text via file parser (`src/lib/parser`)
3. Store file in Supabase Storage (bypass RLS with service role key)
4. Extract entities from text (name, company, designation, etc.)
5. Update `candidates` row with extracted fields
6. Insert row in `candidate_files`

### `processDirectUploadCv` (`cv.process_direct_upload`)
Same steps but file is already uploaded — reads from Supabase Storage rather than downloading from Drive.

## Event Schema
```ts
"cv.process_gdrive_link": { data: { candidateId: string; gdriveUrl: string } }
"cv.process_direct_upload": { data: { candidateId: string; fileUrl: string; fileName: string } }
```

## Supabase Client in Inngest
Uses `SUPABASE_SERVICE_ROLE_KEY` (not the anon key) to bypass RLS for backend storage writes. This key must never be exposed to client-side code.

## Environment Variables Required
```
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
