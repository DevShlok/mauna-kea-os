# Remaining Database Tables — Quick Reference

Notes for tables that don't need a full dedicated file.

---

## mandate_candidates
Junction between [[mandates]] and [[candidates]]. Tracks pipeline `stage`, `score`, `ranking`, `competencies` per candidate-mandate pair. `isSentToClient` = true once the candidate has been submitted. `hasReport` = true once an AI report exists.

---

## clients
Client companies. PK `id` format `CLI-<uuid>`. Has a `slug` for client portal routing. `contacts` (JSON) stores POC list inline rather than a separate table. `linkedClientId` in [[platform_users]] points here.

---

## client_notifications
Notifications surfaced in the client portal. Linked to a specific `clientId` + `mandateId`. `isRead` flag. Created by server actions when a candidate is submitted or status changes.

---

## client_remarks
Free-text feedback from a client contact on a candidate+mandate combination. Visible to consultants in the candidate detail view.

---

## candidate_notifications / consultant_notifications
In-app notification queues. `candidate_notifications` targets a `candId`. `consultant_notifications` targets a `userId` (or a `targetRole` for broadcast). Both have `isRead` flag.

---

## reference_checks
Each row is one reference interview. `responses` (JSON) stores per-question answers. `summaryPositives/Improvements/Neutral` are consultant-written summaries. `isSharedWithClient` = true when the candidate portal should show it. `isVerified` = true when the consultant marks the reference complete.

---

## candidate_verifications
One row per candidate (unique on `candId`). `status` = `Not Started | In Progress | Verified`. `badgeLevel` reserved for future tiered badges.

---

## float_followups / float_activities
- `float_followups`: structured next-action tasks (dueDate, status, note) linked to a [[floats]] record
- `float_activities`: unstructured activity log (meeting, email, event) per float; `isPinned` surfaces in the top of the activity feed

---

## float_references
Reference contacts attached directly to a candidate (not a specific float). Used in background verification. Distinct from [[reference_checks]].

---

## candidate_files
File upload history per candidate. `fileType` = `'CV / Resume' | 'Linkedin Profile'`. `extractedText` holds the full raw text extracted by the parser, used for AI report generation.

---

## candidate_career_timeline
Structured career entries per candidate (Phase 4). Each row is one job: `roleTitle`, `companyName`, `startDate`, `endDate`, `isCurrent`. `sortOrder` for custom ordering. Used in the candidate profile view.

---

## candidate_jobs
Curated job postings posted by consultants and visible in the candidate portal jobs board. `targetCandIds` (JSON string[]) allows a job to be pinned to specific candidates (bypasses normal visibility filter). `highlights` (JSON string[]) used for tag-based job matching.

---

## candidate_job_interests / candidate_applications
- `candidate_job_interests`: interest signal per (job, candidate) — `status` = `Shown | Interested | Not Interested`. Unique on `(jobId, candId)`.
- `candidate_applications`: formal application records. `source` = `'direct' | 'consultant'`.

---

## dream_company_status
Per-candidate dream company tracking. `status` = `Not Started | Outreach Sent | In Talks | Interviewed | Rejected | Placed`. Updated by consultants in the admin view; visible to candidates in Dream 10 portal.

---

## engagement_list_items / call_plans
Internal CRM tools for consultants. `engagement_list_items` = personal calling/BD list. `call_plans` = weekly/daily targets. `userId` scoped per consultant.

---

## time_logs / leave_requests
Internal HR. `time_logs` records clock-in/out/break events. `leave_requests` has approval workflow (Pending → Approved | Rejected) managed by admins.

---

## master_industries / master_locations / master_clients
Dictionary / autocomplete data. `master_industries` = sector taxonomy. `master_locations` = normalisation map for raw location strings. `master_clients` = company intelligence (HR leads, sources). Populated by admin and import scripts.

---

## user_preferences
Per-user or org-wide saved preferences for the AdvancedTable (column visibility, widths, order). `userId = NULL` means admin-published default. `prefKey` = `'candidateListCols' | 'candidateWidgetLayout'`. See [[Architecture/advanced-table]].
