# Client Hiring Command Centre

**Route:** `/[clientSlug]/` and `/dashboard/mandates/[id]` (Recruiter Client Controls)
**Access:** `requireRole(['client', 'admin', 'consultant'])`
**Tables:** [[Database/clients]], [[Database/mandates]], [[Database/mandate_candidates]], [[Database/interviews]], [[Database/client_action_tasks]], [[Database/candidate_activity_log]], [[Database/client_user_department_access]], [[Database/client_user_mandate_access]]

## What It Is
The Client Hiring Command Centre is a search-depth and decision-first platform built around search transparency, candidate universe mapping, structured competency matrices, dual ranking systems, and recruiter-controlled candidate visibility.

## Key Capabilities & 6-Screen Architecture
1. **Market Mapping & Universe (Screen 1)**: Full talent universe listing, search depth funnel counts (Mapped → Contacted → Engaged → Assessed → Shortlisted), stage filters, and permission-aware CSV export.
2. **Candidate Engagement Tracker (Screen 2)**: Scannable working list (10–30 candidates) with consultant assessment notes, rejection reasons, and candidate activity audit timeline.
3. **Shortlist & Candidate Comparison (Screen 3)**: Visual candidate cards, dual ranking systems (Consultant P1/P2/P3 vs Client P1/P2/P3), key strengths/concerns, and side-by-side competency comparison matrix.
4. **Candidate Deep Dive (Screen 4)**: 360° candidate profile with pinned 1-page Executive Summary, 4 assessment tabs, and watermarked PDF/report download logging.
5. **Client Decisions & Interview Scheduling (Screen 5)**: Per-candidate decisions (Interview, Hold, Reject with multi-select reasons, More Info) and interview round tracking (`interviews` table).
6. **Next Steps Feedback Loop (Screen 6)**: Multi-select next steps submission converting client requests into tracked consultant tasks (`client_action_tasks`).

## Security & Access Control
- **Tenant Isolation**: `linkedClientId` validation on every query.
- **Department Isolation (CP-6)**: `client_user_department_access` table restricts client users to specific functional departments.
- **Mandate Overrides (CP-7)**: `client_user_mandate_access` table grants ad-hoc access to specific mandates outside a user's department.
- **Automated Invitation (CP-8)**: `inviteClientUserAction` provisions client accounts and sends setup links.
