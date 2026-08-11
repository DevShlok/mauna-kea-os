# Executive Tagging & Search UX Engine

**Routes:** `/dashboard/candidates`, `/dashboard/candidates/[id]`, `/${slug}/profile`  
**Components:** `TagInput.tsx`, `CandidatesClient.tsx`, `FlCandidateClient.tsx`, `CandidateProfileView.tsx`  
**Helper Library:** `src/lib/tag-matching.ts` (`computeTagOverlapScore`)  
**Actions:** `updateCandidateTagsAction`, `importCandidateDocumentAction`  
**Tables:** [[Database/other-tables#candidates]], [[Database/other-tables#mandates]]

## Overview
A unified cross-system executive tagging and search engine that activates candidate expertise tags (`expTags`), target roles (`dreamRoles`), target companies (`dreamCos`), and mandate sector tags across Mauna Kea OS.

## Features & Implementation
1. **Reusable `TagInput.tsx` Pill Component**:
   - Modern pill rendering with preset executive suggestions (e.g. *M&A, FP&A, Big4 Alum, IFRS, C-Suite, Turnaround, Private Equity*).
   - Keyboard tag creation (`Enter` / `,`), 1-click removal, and tag limits.
2. **Interactive Search Table Pills (`CandidatesClient.tsx` & `MandatesClient.tsx`)**:
   - Table row tags render as interactive filter buttons. Clicking any tag instantly filters the candidate database or mandate database by that skill/sector.
3. **Candidate Detail Tag Overhaul (`FlCandidateClient.tsx`)**:
   - Prominently displays Executive Expertise & Skill Tags and Target Roles on the candidate header card.
   - Inline tag editing with `updateCandidateTagsAction` server action.
4. **Tag Overlap Match Score Engine (`tag-matching.ts`)**:
   - Computes real-time Tag Overlap percentage (e.g. `4/5 Tags Matched (80%)`) comparing candidate skills against mandate requirements.
5. **AI Resume Tag Auto-Extraction**:
   - `importCandidateDocumentAction` extracts 5–8 standardized `expTags` from uploaded resume documents.

## Related Notes
- [[Features/internal-os]]
- [[Features/candidate-portal]]
- [[Database/other-tables#candidates]]
