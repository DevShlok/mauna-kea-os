# Legal & Finance Module — Master Plan
## MK OS Commercial Operating System

**Created:** 2026-08-11  
**Scope:** 4-phase implementation, estimated 6–10 weeks total  
**Status:** Planning complete — ready for implementation  

---

## Overview

The Legal & Finance module transforms MK OS into a complete commercial operating system. It becomes the single source of truth for client contracts, commercial terms, invoice generation, payment tracking, and compliance — all tightly integrated with the existing Client, Mandate, and Candidate modules, with zero duplicate data entry.

---

## Architecture Decision

**Stack:** Next.js App Router (Server Components) + Drizzle ORM + Supabase Postgres + Supabase Storage  
**Pattern:** Follows the exact same patterns already established in the existing MK OS codebase:
- Server Components for all read pages (force-dynamic)
- Server Actions for all mutations (`"use server"`)
- Drizzle ORM with Zod validation
- `neo-card`, `neo-btn`, `neo-table` CSS classes for UI
- `consultantNotifications` table for in-app alerts
- `requireRole([...])` for all authorization guards

**No new frameworks** introduced — this module is a pure extension of what already exists.

---

## End-to-End Data Flow

```
Create Client → Fill Legal/Billing Details
        │
        ▼
Create Contract → Auto-fetch Client Data → Select Template
        │
        ▼
Approval Workflow → Upload Signed Contract → Status: "Signed"
        │
        ▼
Commercial Terms Stored (snapshot frozen — immutable)
        │
        ▼
Create Mandate → Candidate Journey → Offer Accepted
        │
        ▼
Raise Invoice → Auto-fetch Client + Contract + CTC + Commercial %
        │         (data integrity validation runs before generation)
        ▼
Invoice Generated → Invoice Number: MK-IN-YYYY-NNNNN
        │
        ▼
Finance Shares Invoice → Due Date Reminders Fired Automatically
        │
        ▼
Record Payment(s) → Partial or Full → Auto-status Update
        │
        ▼
Revenue Reports → Compliance Dashboard → Audit Trail
        │
        ▼
Renewal Reminder (60/45/30/15/7 days) → Contract Renewal
```

---

## Phase Summary

| Phase | Name | Key Deliverables | Priority |
|-------|------|-----------------|----------|
| **1** | [Foundation](./legal-finance-phase1.md) | Schema, sidebar, permissions, libs | ⚡ Must-first |
| **2** | [Contract Management](./legal-finance-phase2.md) | Wizard, repository, approval, renewal | 🔴 High |
| **3** | [Invoice Management](./legal-finance-phase3.md) | Raise invoice, PDF, edit/cancel/CN, reminders | 🔴 High |
| **4** | [Payments & Reports](./legal-finance-phase4.md) | Payments, revenue, compliance, AI, audit UI | 🟡 Medium |

---

## New Tables (Migration 0032)

| Table | Purpose | Rows grow over time |
|-------|---------|-------------------|
| `contracts` | Master contract registry | Yes (every new/renewal) |
| `contract_documents` | File upload history (append-only) | Yes |
| `invoices` | Invoice registry (all versions) | Yes |
| `invoice_payments` | Payment event ledger | Yes |
| `lf_audit_logs` | Immutable audit trail | Yes (never deleted) |
| `lf_sequences` | Auto-number counters | Fixed (one row per type/year) |

**Existing tables extended (additive only):**
- `clients` — 17 new nullable columns for legal/billing data

---

## New Files Created

### Library & Infrastructure
- `src/lib/lf-sequences.ts` — auto-number generator
- `src/lib/lf-audit.ts` — immutable audit log writer
- `src/lib/number-to-words.ts` — INR amount to words
- `src/lib/ids.ts` — extended with `newContractId`, `newInvoiceId`

### Actions
- `src/actions/legal-finance.ts` — all contract + invoice + payment actions
- `src/actions/legal-finance-ai.ts` — AI analysis actions

### API Routes (Cron)
- `src/app/api/internal/contract-renewal-reminders/route.ts`
- `src/app/api/internal/invoice-reminders/route.ts`

### Feature Components
```
src/features/legal-finance/
├── contracts/components/
│   ├── ContractsClient.tsx
│   ├── ContractWizard.tsx
│   └── ContractDetailClient.tsx
├── invoices/components/
│   ├── InvoicesClient.tsx
│   ├── RaiseInvoiceClient.tsx
│   ├── InvoiceDetailClient.tsx
│   └── InvoicePdf.tsx
├── payments/components/
│   ├── PaymentsClient.tsx
│   ├── RecordPaymentModal.tsx
│   └── PaymentHistoryModal.tsx
├── reports/components/
│   ├── ReportsClient.tsx
│   ├── RevenueChart.tsx
│   └── AgingTable.tsx
├── compliance/components/
│   └── ComplianceClient.tsx
└── audit-log/components/
    └── AuditLogClient.tsx
```

### App Routes
```
src/app/dashboard/legal-finance/
├── layout.tsx
├── page.tsx (redirect)
├── contracts/
│   ├── page.tsx
│   ├── new/page.tsx
│   └── [id]/page.tsx
├── invoices/
│   ├── page.tsx
│   ├── new/page.tsx
│   └── [id]/page.tsx
├── payments/page.tsx
├── reports/page.tsx
├── compliance/page.tsx
└── audit-log/page.tsx
```

---

## Modified Existing Files

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add 6 new tables + relations + type exports |
| `src/lib/ids.ts` | Add newContractId, newInvoiceId |
| `src/lib/validations.ts` | Extend createClientSchema, add createContractSchema |
| `src/components/shared/Sidebar.tsx` | Add Legal & Finance nav group |
| `src/actions/index.ts` | Extend updateClientAction with new billing fields |
| `src/features/clients/components/ClientDetailClient.tsx` | Add Contracts tab, financial strip, Invoices tab |
| `src/features/clients/components/NewClientClient.tsx` | Add Legal & Billing accordion section |
| `src/features/mandates/components/MandateDetailClient.tsx` | Add Raise Invoice button |
| `src/app/dashboard/clients/[id]/page.tsx` | Fetch + pass invoice summary and contracts |
| `vercel.json` | Add cron job entries |
| `package.json` | Add @react-pdf/renderer |

---

## Role Permissions Summary

| Capability | Admin | Consultant | Finance | Client | Candidate |
|-----------|-------|------------|---------|--------|-----------|
| View contracts | All | Own | All | No | No |
| Create/edit contract | Yes | Yes | No | No | No |
| Approve contract | Yes | No | Yes | No | No |
| Upload signed copy | Yes | Yes | Yes | No | No |
| View invoices | All | Own | All | No | No |
| Raise invoice | Yes | Yes | Yes | No | No |
| Edit/share/cancel invoice | Yes | No | Yes | No | No |
| Record payment | Yes | No | Yes | No | No |
| View reports | Yes | No | Yes | No | No |
| View compliance | Yes | No | Yes | No | No |
| View audit log | Yes | No | Yes | No | No |
| AI queries | Yes | No | Yes | No | No |

---

## Governance Rules (Hard Requirements)

1. **No hard deletes** — every contract/invoice/payment uses soft delete only (`is_deleted = true`)
2. **Immutable audit log** — `lf_audit_logs` only accepts INSERT from application code
3. **Record locking** — contracts with status `Signed` and invoices with status `Shared`/`Paid`/`Overdue` are locked; changes require new versions
4. **Snapshot freezing** — client legal/billing data is snapshotted at contract/invoice creation time; editing the client does not change historical records
5. **Contract-driven invoicing** — commercial % always fetched from signed contract; manual entry requires Finance role + mandatory reason
6. **Duplicate prevention** — server-side check before any invoice is generated
7. **Sequential numbering** — contract and invoice numbers are generated via atomic DB sequence; no gaps, no duplicates

---

## Implementation Order

### Week 1 — Phase 1
- Run migration 0032
- Add schema tables to schema.ts
- Add ID generators and lib files
- Update sidebar
- Deploy placeholder routes

### Weeks 2–3 — Phase 2
- Contract Repository page
- Contract Creation Wizard (4 steps)
- Contract Detail View
- Client page Contracts tab
- File upload to Supabase Storage
- Approval workflow
- Renewal reminder cron

### Weeks 4–5 — Phase 3
- Invoice generation flow
- Invoice Repository with status tabs
- Invoice PDF (react-pdf)
- Invoice edit/version/cancel
- Credit note generation
- Client financial strip
- Mandate "Raise Invoice" button
- Invoice reminder cron

### Weeks 6–8 — Phase 4
- Payment recording + reversal
- Revenue reports
- Aging analysis
- Compliance dashboard
- Audit log UI
- AI query interface
- Bulk export/reminders

---

## Dependencies to Install

```bash
npm install @react-pdf/renderer          # Invoice/contract PDF generation
npm install xlsx                          # Excel export for bulk operations  
npm install date-fns                      # Date arithmetic (if not already installed)
```

---

## Notes for Implementation

1. **`force-dynamic` on all L&F pages** — financial data must always be fresh, never cached
2. **The `clientSnapshot` and `commercialSnapshot` JSON fields** on contracts and invoices are the single most important design decision — they ensure that editing a client or contract never corrupts historical financial records
3. **`lf_audit_logs` must never be wrapped in a try-catch that swallows failures silently** — use the `writeLfAuditLog` helper which has its own internal error handling
4. **Supabase Storage bucket `legal-finance`** must be created manually in the Supabase dashboard before Phase 2 upload features go live
5. **The `lf_sequences` table uses optimistic locking** — under high concurrency, the INSERT...ON CONFLICT DO UPDATE pattern is safe; no race conditions
6. **All monetary amounts stored as DOUBLE PRECISION (Lakhs)** — follow the existing `candidates.ctc` convention: value of `120` means ₹120 Lakhs (₹1.2 Cr). The invoice calculation converts to absolute rupees for display and storage in `fee_before_tax`/`total_amount`
