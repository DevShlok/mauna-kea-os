# BRD Phase 6 — Org/Ops & Parked Items
> **Timeline:** Ongoing / No sprint sequencing  
> **Depends on:** All phases complete or in progress  
> **Goal:** Document items that have no codebase footprint (org/ops decisions) and items explicitly parked for later. This phase is a reference document, not a build spec.

---

## Section A: Org & Ops (No Codebase Footprint)

These items are business and operational decisions. They affect how the product is run, not how it is built. Track them in a project management tool (Notion, Linear, etc.) — not in GitHub sprints.

### A1. B2B Corporate Upskilling Delivery

**What it is:** MK delivers upskilling programs to corporate clients (HR leaders, finance teams, CFO cohorts) as a packaged offering. Separate from the candidate-facing upskilling engine.

**Ops requirements:**
- Define curriculum packages and pricing (CFO Readiness, AI for Finance, Executive Presence, etc.)
- Set up delivery logistics (Zoom webinar, in-person, hybrid)
- Client billing and contract templates (separate from Razorpay consumer subscriptions)
- Trainer/faculty sourcing and scheduling

**Codebase impact (eventual):** A `b2bOrders` table and a client-facing course delivery tracker — but only build this once B2B contracts are signed and you know the exact workflow. Do not build speculatively.

---

### A2. Equity & Governance Model

**What it is:** The "Dream 10 Executive Representation" with equity-backed agreements between MK and top candidates (Tier A, Executive plan).

**Ops requirements:**
- Legal framework for equity representation agreements (requires a company secretary / lawyer)
- Define equity percentage, vesting conditions, exit triggers
- How MK earns on placement vs. equity split vs. retainer — needs an actual term sheet

**Codebase impact (eventual):** A `representationAgreements` table tracking signed agreements per candidate, associated with mandate placements. Build only after the legal structure is finalized. The `candidateBadges.badgeType = 'dream_10_represented'` hook can be reserved in the schema now.

---

### A3. Community Centre of Excellence (CoE)

**What it is:** The operational team that runs the three community cohorts (CFO Network, Women Leaders Circle, AI Practitioners Guild) — community managers, content calendars, guest speaker coordination.

**Ops requirements:**
- Hire or assign community managers per cohort
- Define moderation policies and escalation paths
- Content calendar per community (monthly topics, guest sessions)
- Sponsor/partner relationships for community events

**Codebase impact:** Minimal. The Phase 5 code gives them the tools; this is about who uses them and how. One addition: a `communityAnnouncements` or `communityEvents` table with date/time/speaker fields for event listings — low effort, add in Phase 5 if community managers need it.

---

### A4. Pan-India Mothers' Reference Network Operations

**What it is:** The network of working mothers MK uses for qualitative reference checks — a human network, not a digital product. This is how reference check data is gathered, not stored.

**Ops requirements:**
- Network recruitment and onboarding
- Confidentiality agreements with all network members
- Structured questionnaire used during calls (maps to `referenceChecks.responses` JSON field already in schema)
- SLA for turnaround on reference checks (e.g., 5 business days)

**Codebase impact:** None. The `referenceChecks` schema (Phase 0) already stores everything needed. The network is the input, not a system component.

---

## Section B: Parked Items (Not Sequenced)

These were originally in the BRD but have been explicitly parked. They require either AI infrastructure or a use case that isn't yet fully defined.

### B1. Continuous AI Career Insights

**Original BRD requirement:** An ongoing AI layer that analyzes candidate career trajectory and generates proactive insights ("you should target CHRO roles in BFSI given your profile growth").

**Why parked:** The manual substitute (consultant-curated guidance blocks, Phase 3) covers the near-term need. This feature only adds value over Phase 3 if the insights are genuinely personalized and not already derivable from a simple rules table — which requires either an LLM with candidate context or a recommendation model trained on placement outcomes.

**Trigger to revisit:** When MK has ≥ 500 candidates with complete profiles + assessment tiers + at least one float outcome (Hired/Rejected). That dataset is the minimum training signal.

**Codebase prep (do now, costs nothing):**
- Ensure `candidates.cvText` is being stored (already in schema) — this is the primary input for any future LLM call
- Ensure `floats` rows have status outcomes recorded — they do
- No new tables needed

---

### B2. AI-Based % Match Scoring on Jobs Board

**Original BRD requirement:** "AI-personalized job recommendations" with a percentage match score per job.

**Why parked:** Phase 3 delivers tag-overlap scoring — a simpler version that does the same job. The AI version (embedding similarity between CV text and job description) is a meaningful improvement only when the manually-curated jobs board has enough jobs (>50 active listings) to make sorting matter.

**Trigger to revisit:** When curated jobs board has >50 active listings and candidates are browsing without clicking.

**Codebase prep (do now):**
- Store `candidateJobs.description` as full text (already `text` type) ✅
- Store `candidates.cvText` (already in schema) ✅
- When ready: use OpenAI `text-embedding-ada-002` or a local model to compute cosine similarity between `cvText` and `description + highlights` — scores stored in `candidateJobInterests.score` (add column when needed)

---

## Section C: Dependency & Phase Sequence Summary

```
Phase 0 ──────────────────────────────────────────────────────────────────────►
         Phase 1 ──────────────────────────────────────────────────────────────►
         Phase 2 (parallel with Phase 1) ─────────────────────────────────────►
                          Phase 3 ─────────────────────────────────────────────►
                                    Phase 4 ──────────────────────────────────►
                                              Phase 5 ────────────────────────►
Phase 6: Org/Ops (continuous, no sprint clock)
```

### Critical Path
`Phase 0 → Phase 2 → Phase 3 → Phase 4 → Phase 5`

Phase 1 can run in parallel with Phase 2. Phase 3 is the first phase that cannot start until Phase 2 ships (tier value must exist before anything gates on it).

---

## Section D: Permanent Feature Flags Table

Keep a runtime feature flag system to safely gate unreleased or partially-built features. Recommended: store in a `featureFlags` table or use environment variables.

| Flag | Default | Gates |
|---|---|---|
| `FF_ASSESSMENT_ENABLED` | `false` | Phase 2 rubric form visible to consultants |
| `FF_DREAM10_GATED` | `false` | Phase 3 tier gating on Dream 10 |
| `FF_GUIDANCE_ENABLED` | `false` | Phase 3 guidance blocks page |
| `FF_MEMBERSHIP_ENABLED` | `false` | Phase 4 subscription / Razorpay |
| `FF_MENTORSHIP_ENABLED` | `false` | Phase 4 mentorship marketplace |
| `FF_BENCHMARKING_ENABLED` | `false` | Phase 5 benchmarking |
| `FF_COMMUNITIES_ENABLED` | `false` | Phase 5 community cohorts |

These can be simple Next.js environment variables (`NEXT_PUBLIC_FF_*` for client-side checks, server-env for server-side). Flip them to `true` in Vercel env as each phase ships.

---

## Section E: What Must Never Change Without Review

These are existing contracts in the codebase that downstream features depend on:

| Contract | Where Used | Risk if Changed |
|---|---|---|
| `candidates.profileCompletedAt` null = not onboarded | `[clientSlug]/page.tsx` routing | Breaking onboarding gate |
| `floats.status` values: `Shared\|Under Review\|Shortlisted\|Interviewing\|Hired\|Rejected` | `ApplicationsClient.tsx` stage map | Breaks pipeline UI |
| `candidateBadges.badgeType = 'assessment_complete'` | Phase 3 tier gating | Breaks Dream 10 lock |
| `candidateReports.frameworkId = 'rubric-assessment'` | Phase 2 assessment lookup | Breaks rubric read/write |
| `platformUsers.linkedCandidateId` | All candidate auth | Breaks all candidate-portal queries |
| `requireRole(['candidate'])` in candidate actions | All candidate security | Do not remove role checks |
