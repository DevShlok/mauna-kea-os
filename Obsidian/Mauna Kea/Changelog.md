# Changelog

Newest entry on top. Format: `YYYY-MM-DD — what changed — why`

---

2026-08-13 — Consolidated Implementation Plan v2.0 Execution & Client Portal UI/UX Polish — Executed plan and polished Client Portal UI/UX across `/[clientSlug]` routes (including `nykaa-fsn-e-commerce` and `nykaa-fsn-e-commerce/mandates/19`):
- **Command Centre Header & Navigation**: Added "Back to Dashboard" navigation link in `ClientCommandCentreShell` header, enhanced mandate status badge, and added smooth screen transition controls.
- **Executive Hero Banner & Dashboard UI**: Added high-impact dark navy welcome hero strip (`Client Command Centre`), responsive 4-stat metric grid, active account status badge, and always-visible "View Candidates" CTA buttons on mandate cards.
- **Client Command Centre Access**: Extended `requireRole` in `ClientMandateDetailPage` to allow admin and consultant preview alongside client users with fallback resolving client name by slug.
- **Dynamic Funnel Metrics**: Updated `MarketMappingScreen` to calculate search depth funnel metrics dynamically from candidate array counts. Verified `npx tsc --noEmit` clean (0 errors).

2026-08-12 — Client Portal Login Flow Improvements & AI Feature Streamlining — Performed targeted refinements:
- **Client Login Improvements**: Refactored Client Portal authentication and route handling (`/[clientSlug]/mandates/[id]`) for seamless user access, persistent session resolution, and automatic linked client validation.
- **AI Feature Streamlining**: Streamlined Client Hiring Command Centre by removing AI narrative synthesis text boxes and the AI Assistant drawer per user feedback, focusing 100% of the client UI on direct visual benchmarking, 6-screen executive workflows, multi-slot scheduling, and closed-loop task feedback.

2026-08-12 — MK OS Client Hiring Command Centre Launch (MVP Definition & 6-Screen Architecture) — Implemented full Client Hiring Command Centre defined in MVP PRD:
- **DB Schema Migration 0037**: Added `departments`, `mandate_positions`, `download_logs` tables and extended `mandate_candidates` with recruiter visibility switches (`visibleToClient`, `showContactDetails`, `showCompensation`, `showAssessment`, `showComments`), dual rankings (`consultantRanking` P1/P2/P3 vs `clientRanking` P1/P2/P3), and rejection tracking.
- **Recruiter Controls**: Updated `MandateDetailClient.tsx` with Recruiter Visibility Modal (`RecruiterVisibilityModal`) and consultant P1/P2/P3 ranking selector.
- **6-Screen Command Centre Shell (`ClientCommandCentreShell.tsx`)**:
  - **Screen 1 (Market Mapping / Universe)**: `MarketMappingScreen.tsx` displaying search depth funnel metrics (Mapped → Contacted → Engaged → Assessed → Shortlisted), talent universe table, filter controls, and CSV export.
  - **Screen 2 (Candidate Engagement Tracker)**: `EngagementTrackerScreen.tsx` ATS-style table view of 10–30 candidates with profile summaries, Monaki notes, rejection reasons, and candidate activity audit timeline.
  - **Screen 3 (Shortlist & Candidate Comparison)**: `ShortlistCompareScreen.tsx` visual candidate cards, dual rankings, key strengths/concerns, multi-candidate selector, and `CompetencyComparisonMatrix.tsx` side-by-side benchmark matrix across 7 competencies.
  - **Screen 4 (Candidate Deep Dive)**: `CandidateDeepDiveScreen.tsx` 360° candidate assessment profile with top 1-page Executive Summary, 4 assessment tabs, and watermarked PDF download (`logDocumentDownloadAction`).
  - **Screen 5 (Client Decisions & Interview Scheduling)**: `InterviewSchedulingModal.tsx` decision buttons (`Interview`, `Hold`, `Reject`, `Request Info`) and multi-slot date/time scheduler.
  - **Screen 6 ("Next Steps" Feedback Loop)**: `NextStepsModal.tsx` multi-select next steps task submission.

2026-08-12 — Legal & Finance Admin Contract Templates, Dashboard Navigation Hierarchy & Official Tax Invoice Layout — Executed requested BRD updates:
- **Admin Contract Templates**: Added DB migration `0036_contract_templates.sql` creating `contract_templates` table. Implemented `src/actions/contract-templates.ts` (`getContractTemplatesAction`, `saveContractTemplateAction`, `deleteContractTemplateAction`), `/dashboard/legal-finance/contracts/templates` page route, and `ContractTemplatesClient.tsx` for configuring default success fees, retainer amounts, replacement guarantees, and standard legal clauses. Updated `ContractWizard.tsx` with dynamic template selector in Step 2.
- **Structural Sidebar Layout & Hover Auto-Open Fix**: Fixed structural layout in `Sidebar.tsx` by isolating the top Logo Header (`MK Mauna Kea`) and bottom User Footer as fixed non-scrolling sections (`shrink-0`). Restored smooth hover auto-open animations with CSS Grid content containment, ensuring the logo and user profile never move up or down when options expand.
- **Official Tax Invoice Alignment**: Verified `InvoiceDetailClient.tsx` matching 100% of sample invoice `image_0360c2.jpg` (Supplier details for `Mauna Kea International Pvt Ltd`, GSTIN `06AAUCM4115F1ZG`, HSN/SAC `998311`, Receiver & Consignee details, CGST/SGST/UTGST/IGST tax splits, HDFC Bank account `99955456456456` & IFSC `HDFC0000572`, and certified signatory seal).

2026-08-12 — Major Project Cleanup & Dead Code Removal — Removed 18 obsolete scratch files, standalone one-off migration scripts, temporary text logs, and superseded server action functions (`issueCreditNoteAction` replaced by `createCreditNoteAction`). Deleted 645 redundant lines of code. `npx tsc --noEmit` and `npx next build` verified clean (0 errors across 59 routes).

2026-08-12 — BRD Phase 5 Benchmarking, Legal Finance Credit Notes, Invoice Versioning, Mandate Pre-filling & Verification Fixes — Executed approved scope from Master Feature Audit:
- **Phase 5 Benchmarking**: Created `src/actions/benchmarking.ts` (`getBenchmarkAction`), candidate portal benchmarking route `/[clientSlug]/benchmarking/page.tsx` with redirect at `/candidate/benchmarking`, `BenchmarkingClient.tsx` featuring neo-card design, percentile score badge, P25/P50/P75 salary distribution bars, candidate CTC indicator, and filter form. Added Benchmarking link to `CandidateSidebar.tsx`.
- **Legal & Finance Credit Notes & Versioning**: Added DB migration `0035_invoice_extensions.sql` adding `invoice_type`, `parent_invoice_id`, and `version` columns. Implemented `createCreditNoteAction` (issuing `MK-CN-YYYY-NNNNN`) and `amendInvoiceAction` (`MK-IN-YYYY-NNNNN-vX` amendment versioning) in `legal-finance.ts`. Updated `InvoiceDetailClient.tsx` with Credit Note & Amend toolbar buttons and dynamic header badge.
- **Mandate → Raise Invoice Pre-fill**: Enhanced `RaiseInvoicePage` and `RaiseInvoiceClient` to accept `mandateId` query parameter from `MandateDetailClient`, auto-selecting client and mandate candidates.
- **Quick Wins Verified**: Confirmed `profile_complete` badge creation on onboarding finish, Applications Inbox status updates, contract/invoice reminder cron schedules in `vercel.json`, and client financial strip on client detail page.

2026-08-11 — Invoice legal layout gap analysis + phase-wise implementation plan — Reviewed email feedback on Contracts & Invoice modules. Produced full gap audit: 14 legally mandatory fields missing from printed Tax Invoice (MK entity name, GSTIN, PAN, address, Place of Supply, bank details, signatory, T&C, reverse charge). Created `docs/contracts-invoice-implementation-plan.md` with 5 phases covering invoice legal compliance, .docx fix, navigation, email drafts, and GSTIN lookup. Updated Obsidian vault.

2026-08-11 — Invoice module enhancements: candidate linkage, multi-line billing, UTGST — Added candidate-first selection flow with mandate/client/contract auto-resolve. Added multi-placement line items (`+Add`) with proposal deck CTC slab auto-matching (<50L=18%, 50L–1Cr=20%, >1Cr=25%). 100% editable particulars per line. Precise CGST/SGST/UTGST/IGST tax splits. DB migration `0034` for `line_items`, `utgst_amount`, `tax_type`. `tsc --noEmit` clean.

2026-08-10 — Unified Executive Tagging System & Executive Search UX overhaul — Created reusable `TagInput.tsx` pill component with preset suggestions. Created `tag-matching.ts` (`computeTagOverlapScore`). Added `updateCandidateTagsAction` server action. Made table tags interactive in `CandidatesClient.tsx` and `MandatesClient.tsx`. Rendered and enabled inline editing for executive tags in `FlCandidateClient.tsx` and `CandidateProfileView.tsx`. Enhanced AI resume parser (`importCandidateDocumentAction`) to auto-extract 5-8 standardized `expTags`.

2026-08-10 — Unified single-button Smart Candidate Import & auto-detection engine — Merged separate import buttons into a single "Import Candidate" button in `CandidatesClient.tsx` and `CandidatesImportModal.tsx`. Built format auto-detection branching: tabular files (`.xlsx`, `.csv`) update database table records only; document resume files (`.pdf`, `.doc`, `.docx`, `.txt`) invoke `importCandidateDocumentAction` to parse candidate profile details via AI, create/update database records, and attach CV files.

2026-08-10 — Database connection resilience & graceful DNS offline handling — Added `max_lifetime: 60` and `connect_timeout: 10` to `db/index.ts` to reset stale sockets after laptop sleep/wake cycles. Added clean fallback error logging in `dashboard/layout.tsx` for `ENOTFOUND` DNS lookup failures.

2026-08-10 — Full completion of 5 key BRD requirements (#8, #10/#25, #5, #19, #24) — Implemented candidate-facing AI Assessment & Psychometric Questionnaire widget (`CandidateAssessmentWidget.tsx`), Assessment Outcome Clarification Query modal, instant AI Job Match % score engine (`computeJobMatchScore` in `job-matching.ts`), dynamic AI Career Trajectory Roadmap generator (`AICareerRoadmapWidget.tsx`), and Mentor Guidance Session request modal with domain filtering (`ConsultantDirectoryClient.tsx`).

2026-08-10 — Candidate Profile Change Approval System & Candidate Portal BRD completion — Implemented consultant/admin review approval workflow for candidate edits to sensitive fields (compensation, notice period, designation, work history, education) with PostgreSQL table `candidate_profile_change_requests`, candidate pending banner, and consultant side-by-side review panel. Finalized Candidate Portal BRD items including conversational onboarding option pills & progress animation, real-time consultant directory data binding, milestone verification badges, and unified applications tracker with BRD workflow stages. Optimized UI animation performance across sidebar and global CSS.

2026-08-10 — strict manual/AI report isolation, candidate sync — Fixed critical bug where AI Workbench operations (generate, fetch, delete) blindly overwrote or leaked manual rubric assessments (`frameworkId: 'rubric-assessment'`). Built `/api/sync-candidates` to backfill missing badges and fix pipeline statuses across candidates.

2026-08-08 — initial knowledge base bootstrap — established vault structure from scratch, documented all 30+ DB tables, 3-portal architecture, auth/RBAC model, integrations, background jobs, AdvancedTable abstraction, and 5 decision records covering audit logging, floats vs candidates, RBAC enforcement, AdvancedTable rationale, and no-raw-scores-to-candidates policy


