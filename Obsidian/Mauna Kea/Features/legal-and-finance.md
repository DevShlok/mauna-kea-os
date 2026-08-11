# Legal & Finance Module — Architecture & Documentation

**Last Updated:** 2026-08-11  
**Module Path:** `src/features/legal-finance/`  
**Actions:** `src/actions/legal-finance.ts`  
**Schema:** `src/db/schema.ts` (contracts, invoices, invoice_payments, lf_audit_logs, lf_sequences)

---

## Overview

The **Legal & Finance Module** is the commercial backbone of Mauna Kea OS. It manages contract lifecycle, candidate-linked multi-placement tax invoicing, payment collection, compliance risk monitoring, and revenue analytics.

**Guiding principle:** Every invoice must be traceable to a Candidate → Mandate → Client → Contract chain. No orphan invoices.

---

## Database Relational Model

```
clients (id) ◄──────────────────────────────── (client_id)
    │                                                │
    │                                           contracts (id)
    │                                                │ (contract_id)
    └──────────── mandates (id) ◄── (mandate_id) ── invoices (id)
                       │                                  │
                  candidates (id) ◄── (cand_id) ──────────┘
                                                          │
                                                 invoice_payments (id)
                                                          │
                                                   lf_audit_logs
```

**Key relationships:**
- `clients` ← `contracts` ← `invoices` ← `invoice_payments`
- `mandates` → `invoices` (mandate linkage)
- `candidates` → `invoices` (candidate linkage — governance deterrent)
- `contracts.client_snapshot` (JSONB): Point-in-time cache of client state at contract creation
- `invoices.client_snapshot` (JSONB): Point-in-time cache of client state at invoice creation
- `invoices.line_items` (JSONB): Array of placement line items for multi-position billing

---

## Migrations Applied

| Migration | Description |
|---|---|
| `0032_legal_finance_foundation.sql` | Core tables: `contracts`, `contract_documents`, `invoices`, `invoice_payments`, `lf_audit_logs`, `lf_sequences`. Extended `clients` with GST/billing fields. |
| `0033_contract_enhanced_fields.sql` | Added `signing_authority_client`, `signing_authority_mk`, `ctc_slabs`, `custom_clauses` to `contracts` |
| `0034_invoice_line_items_and_tax.sql` | Added `line_items` (JSONB), `utgst_amount`, `tax_type` to `invoices` |

**Pending Migrations:**
- `0035_invoice_place_of_supply.sql` — `place_of_supply_code`, `client_state_code` on invoices
- `0036_email_drafts.sql` — email drafts table for Phase 4

---

## Module Structure

```
src/features/legal-finance/
├── audit-log/
│   └── components/AuditLogClient.tsx
├── compliance/
│   └── components/ComplianceDashboardClient.tsx
├── contracts/
│   └── components/
│       ├── ContractWizard.tsx       ← 4-step wizard
│       ├── ContractsClient.tsx      ← Repository table + Excel export
│       └── ContractDetailClient.tsx ← Detail view + approval + upload
├── invoices/
│   └── components/
│       ├── RaiseInvoiceClient.tsx   ← Multi-line invoice form
│       ├── InvoicesClient.tsx       ← Repository table + Excel export
│       └── InvoiceDetailClient.tsx  ← Printable Tax Invoice view
├── payments/
│   └── components/RecordPaymentModal.tsx
└── reports/
    └── components/RevenueReportClient.tsx
```

**Supporting libs:**
- `src/lib/lf-sequences.ts` — Atomic invoice/contract number generator
- `src/lib/lf-audit.ts` — Immutable audit log writer
- `src/lib/number-to-words.ts` — INR total → words ("Rupees Forty Five Lakh Only")
- `src/lib/constants/mk-company.ts` — [PENDING] MK legal entity constants

---

## Contracts Module

### Features Implemented ✅

**4-Step Contract Wizard (`ContractWizard.tsx`)**

- **Step 1 — Client & Parties:**
  - Client selector (linked to `clients` table)
  - Lead Consultant: **auto-populated from `clients.owner`** with manual override
  - Practice/Sector: **auto-populated from `clients.vertical`** with manual override
  - Signing Authorities: Client (Name, Designation, Email) + MK (Name, Designation)
  - Contract period + renewal type

- **Step 2 — Commercials & Fee Structure:**
  - Toggle: Flat Success Fee % vs CTC-Wise Commission Slab Grid
  - Slab grid: add/remove rows (e.g. 0–30L @ 18%, 30–60L @ 20%, >60L @ 25%)
  - Min fee, retainer amount, replacement/guarantee period, payment terms

- **Step 3 — Governance & Special Clauses:**
  - Standard toggles: Exclusivity, Non-Poaching (months), Confidentiality
  - Pre-filled standard clauses: Late payment (1.5%/month), Travel reimbursement
  - Dynamic "Add Custom Clause" builder (Title + Text per clause)

- **Step 4 — Review & Generate:**
  - Full contract preview
  - **Force-scroll approval**: "Approve & Execute" button only activates after scrolling to bottom
  - Download editable **.docx** (HTML-to-Word via `file-saver`)

**Contract Repository (`ContractsClient.tsx`)**
- Sortable/filterable table of all contracts
- Status chips: Draft / Active / Expired / Cancelled
- Excel export restricted to `admin` + `finance` roles

**Contract Detail View (`ContractDetailClient.tsx`)**
- Full contract details + commercial summary
- Approve contract (with scroll-gate on inline doc view)
- Upload signed PDF
- Renew contract (creates child version, sets `parent_contract_id`)
- Soft delete

**Bi-directional DB Sync**
- `createContractAction` → syncs `owner`, `vertical`, `default_payment_terms` back to `clients` table automatically

### Pending / Known Gaps ⚠️

| Gap | Priority | Phase |
|---|---|---|
| .docx still uses "Mauna Kea OS" instead of "Mauna Kea International Pvt Ltd" | P0 | Phase 2 |
| Docx signature page lacks full standard contract format | P1 | Phase 2 |
| Navigation: not explicitly mirroring Clients/Candidates split-view pattern | P1 | Phase 3 |

---

## Invoice Module

### Features Implemented ✅

**Raise Invoice Form (`RaiseInvoiceClient.tsx`)**

- **Step 1 — Candidate & Client Linkage (Governance):**
  - Candidate selector → auto-resolves Mandate, Client, Contract
  - Client selector + Contract selector (optional override)
  - Cannot generate invoice without database-linked candidate

- **Multi-Placement Line Items:**
  - `+Add Placement Line Item` button
  - Per line: Candidate, Role, Annual CTC (Lakhs), Fee %, Auto-calculated Fee Amount
  - **Proposal Deck Slab Auto-Match:** CTC < 50L → 18%, 50L–1Cr → 20%, >1Cr → 25%
  - 100% editable Particulars Description text field per line

- **Tax Regime Selection:**
  - Radio: Intra-State (CGST 9% + SGST 9%) | Union Territory (CGST 9% + UTGST 9%) | Inter-State (IGST 18%)
  - Auto-detects regime from client's state on client selection

- **Auto-Draft on Placement:** When candidate pipeline stage moves to `offer-accepted` / `closed` / `Hired` / `offer-sent` → background invoice draft + Finance team notification

**Invoice Repository (`InvoicesClient.tsx`)**
- Filterable by status, client, date range
- One-click Excel export

**Printable Tax Invoice (`InvoiceDetailClient.tsx`)**
- Multi-line particulars rendering
- Tax breakdown: CGST/SGST or IGST or CGST/UTGST
- Amount in Words (INR)
- Payment ledger + payment recording + reversals
- Credit Note (`CN-MK-IN-YYYY-NNNNN`) + Cancellation with audit log

**INR Number to Words** (`src/lib/number-to-words.ts`)
- "Rupees Forty Five Lakh Sixty Thousand Only"

### Pending Invoice Layout Fixes ❌ (Phase 1 — CRITICAL)

The printed Tax Invoice is missing several **legally mandatory** GST fields:

| Missing Field | Where to Add |
|---|---|
| Legal entity: "Mauna Kea International Pvt Ltd" | Invoice header (not "Mauna Kea OS") |
| MK GSTIN: `06AAUCM4115F1ZG` | Header left block |
| MK PAN: `AAUCM4115F` | Header left block |
| MK State/Code: Haryana / 06 | Header left block |
| MK Address: D6 801, Golf Course St., Gurugram 122011 | Header left block |
| "Original for Recipient" | Invoice classification (next to "TAX INVOICE") |
| Client complete billing address | Billed-To block |
| Place of Supply + State Code | Below Billed-To |
| Remove Annual CTC from printed invoice | Remove from Billed-To right column |
| Total GST aggregate row | Tax totals section |
| Bank Details (HDFC) | Below totals |
| Authorised Signatory section | Footer |
| Certification statement | Footer |
| Terms & Conditions | Footer |
| Reverse charge declaration | Footer |

**All invoice layout changes are documented in:**  
→ [`docs/contracts-invoice-implementation-plan.md`](file:///C:/Users/LENOVO/OneDrive/Desktop/Mauna%20Kea/mauna-kea-os/docs/contracts-invoice-implementation-plan.md)

---

## Automated Cron Jobs (`vercel.json`)

| Path | Schedule | Description |
|---|---|---|
| `/api/internal/contract-renewal-reminders` | `0 8 * * *` | Renewal alerts at 60, 45, 30, 15, 7 days before expiry |
| `/api/internal/invoice-reminders` | `30 8 * * *` | Mark unpaid invoices `Overdue` + notify Finance |

---

## Security & Audit Trail

- **RBAC:** `requireRole(["admin", "consultant", "finance"])` on all actions
- **Immutable Audit Log:** All state changes → `lf_audit_logs` (INSERT only, never UPDATE/DELETE)
  - Fields: `entity_type`, `entity_id`, `action`, `actor_name`, `actor_role`, `previous_value`, `new_value`, `change_reason`
- **Role-restricted exports:** Contract Excel export = admin + finance only

---

## Performance

- All dashboard/page data queries use `Promise.all()` parallelization
- Invoice creation page fetches clients + contracts + candidates in parallel
- Contracts repository: parallel compliance stats + contract list

---

## MK Company Legal Constants (Pending — `src/lib/constants/mk-company.ts`)

> **Action Required from Business:** Confirm bank account number and IFSC before Phase 1 go-live.

| Constant | Value |
|---|---|
| Legal Name | Mauna Kea International Pvt Ltd |
| Brand | Mauna Kea |
| GSTIN | 06AAUCM4115F1ZG |
| PAN | AAUCM4115F |
| State / Code | Haryana / 06 |
| Address | D6 801, Golf Course St., Parshavnath Exotica, Gurugram, HR – 122011 |
| Bank | HDFC Bank (A/c + IFSC pending confirmation) |
| SAC Code | 998313 (pending business confirmation vs 998311) |
