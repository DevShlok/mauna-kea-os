# Verification

**Route:** `/${slug}/verification`  
**Component:** `src/features/candidate-portal/components/VerificationStatusClient.tsx`  
**Tables:** [[Database/other-tables#candidate_verifications]], [[Database/other-tables#reference_checks]], [[Database/candidate_badges]], [[Database/other-tables#candidate_reports]]

## What It Is
The verification page is the candidate's trust and credential hub. It surfaces:
1. Overall verification status (Not Started → In Progress → Verified) with shield double-tick badge.
2. Candidate Self-Assessment Launcher (`CandidateAssessmentWidget.tsx`) featuring 10 psychometric Likert-scale indicators and 2 situational scenario questions.
3. Assessment Outcome & Tier Rating (A/B/C) with evaluation total score (out of 100) and constructive takeaways.
4. Assessment Outcome Clarification Query modal (`requestAssessmentClarificationAction`) logging candidate queries into `consultantNotifications`.
5. Earned badges (`profile_complete`, `reference_check_complete`, `assessment_complete`, `ai_interview_complete`).
6. Reference check summaries (shared ones only).

## Components & Modules
- `CandidateAssessmentWidget.tsx`: Multi-step interactive evaluation modal triggering `submitCandidateSelfAssessmentAction`.
- `VerificationBadgesPanel.tsx`: Renders earned badges from `candidate_badges` table.
- Clarification Request Modal: Allows candidates to inquire about assessment results without altering official scores.

## Reference Checks Shown
Only `reference_checks` rows where `isSharedWithClient = true` render referee name, relationship, and constructive summary positives/improvements.

## Related Notes
- [[Features/candidate-portal]]
- [[Features/ai-workbench]]
- [[Database/candidate_badges]]
