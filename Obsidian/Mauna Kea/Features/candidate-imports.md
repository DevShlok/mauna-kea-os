# Smart Candidate Import System

**Routes:** `/dashboard/candidates`  
**Components:** `CandidatesImportModal.tsx`, `CandidatesClient.tsx`  
**Actions:** `importCandidateDocumentAction`, `mapCandidatesAction`, `checkCandidateDuplicatesAction`, `finalizeCandidatesImportAction`  
**Tables:** [[Database/other-tables#candidates]], [[Database/other-tables#candidate_files]]

## Overview
A unified single-button Smart Candidate Import engine replacing separate bulk CSV/XLSX and resume upload buttons. It auto-detects file format extensions to route candidate data processing appropriately.

## Auto-Detection & Branching

### 1. Tabular / Spreadsheet Files (`.xlsx`, `.xls`, `.csv`)
- **System Mode:** **Update Database Table Only**
- **Process:** Parses tabular rows $\rightarrow$ AI column mapping (`mapCandidatesAction`) $\rightarrow$ Duplicate resolution $\rightarrow$ Inserts/updates `candidates` database records.
- **Attachment:** No CV document file attached.

### 2. Document / Resume Files (`.pdf`, `.doc`, `.docx`, `.txt`)
- **System Mode:** **Update Database Table + Attach CV Document**
- **Process:** Invokes `importCandidateDocumentAction` $\rightarrow$ Parses resume text via AI (`generateObjectWithFallback`) to extract candidate profile fields (Name, Email, Mobile, Designation, Company, Experience, CTC, Education) $\rightarrow$ Performs duplicate check by email/phone/name+company $\rightarrow$ Inserts/updates `candidates` record $\rightarrow$ Uploads CV file to Supabase storage (`candidateFiles`, `hasCv: true`).

## Related Notes
- [[Features/internal-os]]
- [[Database/other-tables#candidates]]
- [[Database/other-tables#candidate_files]]
