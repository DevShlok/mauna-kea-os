# API Security (Input Validation & File Guards)

**Files:** `src/lib/api-guard.ts`, `src/lib/validations.ts`

## Input Validation
All API routes use **Zod** for schema validation. Pattern:
```ts
const schema = z.object({ url: z.string().url({ message: "..." }), ... });
const parsed = schema.safeParse(await req.json());
if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
```

Zod version used: **v4** (note: `required_error` removed in v4; use `{ message: "..." }` instead).

## File Upload Guards (`api-guard.ts`)
Three allowed file-type sets:
- `ALLOWED_DOCUMENT_TYPES` — PDF, DOC, DOCX
- `ALLOWED_IMAGE_TYPES` — JPEG, PNG, WebP
- `ALLOWED_PDF_ONLY` — PDF only

Max file size: `10 MB` (`MAX_DOCUMENT_SIZE_BYTES`).

Helper exports: `validateFile(file, allowedTypes, maxBytes)` returns `{ valid: boolean, error?: string }`.

## Validation Schemas (`validations.ts`)
Centralised Zod schemas for:
- Master data entities (masterClientSchema, masterIndustrySchema, etc.)
- Candidate fields
- Used in API routes and can be reused in server actions

## Cron Secret Guard
`/api/cron/*` routes check for `Authorization: Bearer ${CRON_SECRET}` header. If `CRON_SECRET` env var is not set in production → route rejects all requests (fail-closed). See [[Architecture/auth-and-rbac]].
