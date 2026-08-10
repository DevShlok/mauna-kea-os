# Database — Table Index

All tables live in a single PostgreSQL database (Supabase). Schema: `src/db/schema.ts`. ORM: Drizzle. Migrations in `drizzle/`.

## Core Entity Tables
- [[candidates]] — master person record for every executive candidate
- [[mandates]] — open search mandates (job briefs) from clients
- [[mandate_candidates]] — junction: which candidates are in scope for which mandate
- [[clients]] — client companies
- [[platform_users]] — all users of the platform (admin / consultant / client / candidate)

## Candidate Activity Tables
- [[floats]] — submissions of a candidate to a client/mandate
- [[float_followups]] — follow-up tasks on a float
- [[float_activities]] — activity log (meetings, emails, events) per float
- [[float_references]] — reference information attached to a candidate
- [[candidate_files]] — CV and LinkedIn PDF upload history
- [[candidate_career_timeline]] — structured career history (Phase 4)
- [[candidate_notifications]] — in-app notifications for candidates

## Assessment & Verification
- [[candidate_reports]] — AI-generated and rubric assessment reports (JSON blob, keyed by frameworkId)
- [[candidate_badges]] — earned badges: profile_complete, reference_check_complete, assessment_complete, ai_interview_complete
- [[candidate_verifications]] — overall verification status per candidate
- [[reference_checks]] — individual reference check records

## Frameworks (AI Workbench)
- [[frameworks]] — scoring framework definitions (+ special 'rubric-assessment' record)
- [[framework_categories]] — categories within a framework
- [[framework_criteria]] — criteria within a category

## Client-Facing
- [[client_notifications]] — notifications delivered to client portal users
- [[client_remarks]] — client feedback on a candidate+mandate combination

## Jobs Board (Phase 3+)
- [[candidate_jobs]] — curated job postings visible to candidates
- [[candidate_job_interests]] — interest signals (Interested / Not Interested) per candidate per job
- [[candidate_applications]] — formal applications (direct or consultant-submitted)
- [[dream_company_status]] — per-candidate dream company wishlist + outreach status

## Internal Operations
- [[engagement_list_items]] — consultant's personal Calling / BD lists
- [[call_plans]] — weekly/daily call planning
- [[time_logs]] — clock-in/clock-out for consultants
- [[leave_requests]] — leave management
- [[consultant_notifications]] — internal notifications for consultants/admins

## Master Data (Dictionaries)
- [[master_industries]] — sector taxonomy
- [[master_locations]] — raw → standardised location mapping
- [[master_clients]] — company intelligence (HR leads, owner, source)

## Preferences
- [[user_preferences]] — per-user (or org-wide) saved column layouts and widget configs
