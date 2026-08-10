# Changelog

Newest entry on top. Format: `YYYY-MM-DD — what changed — why`

---

2026-08-10 — Full completion of 5 key BRD requirements (#8, #10/#25, #5, #19, #24) — Implemented candidate-facing AI Assessment & Psychometric Questionnaire widget (`CandidateAssessmentWidget.tsx`), Assessment Outcome Clarification Query modal, instant AI Job Match % score engine (`computeJobMatchScore` in `job-matching.ts`), dynamic AI Career Trajectory Roadmap generator (`AICareerRoadmapWidget.tsx`), and Mentor Guidance Session request modal with domain filtering (`ConsultantDirectoryClient.tsx`).

2026-08-10 — Candidate Profile Change Approval System & Candidate Portal BRD completion — Implemented consultant/admin review approval workflow for candidate edits to sensitive fields (compensation, notice period, designation, work history, education) with PostgreSQL table `candidate_profile_change_requests`, candidate pending banner, and consultant side-by-side review panel. Finalized Candidate Portal BRD items including conversational onboarding option pills & progress animation, real-time consultant directory data binding, milestone verification badges, and unified applications tracker with BRD workflow stages. Optimized UI animation performance across sidebar and global CSS.

2026-08-10 — strict manual/AI report isolation, candidate sync — Fixed critical bug where AI Workbench operations (generate, fetch, delete) blindly overwrote or leaked manual rubric assessments (`frameworkId: 'rubric-assessment'`). Built `/api/sync-candidates` to backfill missing badges and fix pipeline statuses across candidates.

2026-08-08 — initial knowledge base bootstrap — established vault structure from scratch, documented all 30+ DB tables, 3-portal architecture, auth/RBAC model, integrations, background jobs, AdvancedTable abstraction, and 5 decision records covering audit logging, floats vs candidates, RBAC enforcement, AdvancedTable rationale, and no-raw-scores-to-candidates policy


