# frameworks

**Table:** `frameworks` | **PK:** `id varchar(50)` (human-readable slug)

## Purpose
Defines scoring frameworks used by the AI Workbench to structure candidate reports. Each framework has categories → criteria. Also hosts the special `rubric-assessment` record used by Phase 2.

## Special Records
| id | Purpose |
|---|---|
| `rubric-assessment` | Manual consultant rubric (Phase 2). reportSections = `["Behavioral","Psychometric","Cultural Fit"]`. Framework categories/criteria are NOT used — scoring is hardcoded in `src/lib/rubric.ts`. |

## Relationships
- → [[framework_categories]] (many)
- → [[candidate_reports]] (many, via frameworkId)
- → [[mandates]] (many, frameworkId is optional on a mandate)

## Sub-tables
- **`framework_categories`** — category within a framework (name, weight, sortOrder)
- **`framework_criteria`** — criterion within a category (name, weight, sortOrder)

## Route
`/dashboard/frameworks` — admin manages framework definitions
