# Legal & Finance Module Architecture & Documentation

## Overview
The **Legal & Finance Module** provides enterprise-grade commercial contract lifecycle management, candidate-linked multi-line tax invoicing (CGST/SGST/UTGST/IGST splits), payment collection ledgers, compliance risk monitoring, revenue reporting, and AI-assisted financial query handling.

---

## Key Features & Capabilities

### 1. Contract Management & Generation
- **Auto-Population**: Auto-populates Lead Consultant (`client.owner`) and Practice/Sector (`client.vertical`) upon client selection, with manual override capability.
- **Signing Authorities**: Captures Client Signatory (Name, Designation, Email) and Mauna Kea Signatory (Name, Designation).
- **CTC-Wise Commission Slabs**: Choice between flat fee % or a multi-tier CTC Commission Slab Grid (e.g. 0–30L @ 18%, 30–60L @ 20%, >60L @ 25%).
- **Generic & Custom Clauses**: Standard governance clauses (Exclusivity, Non-poaching lock-in, Late payment interest, Travel reimbursement) plus dynamic "Add Custom Clause" builder.
- **Editable Word Document (.docx) Generator**: Step 4 review generates a formatted Microsoft Word document blob for instant editing in MS Word before uploading signed executed copies.
- **SaaS-Style Force-Scroll Approval Inspection**: Approvers must scroll through all contract terms to the bottom before the "Approve & Execute" button becomes active.
- **Bi-Directional Database Sync**: Saving or updating a contract automatically syncs Lead Consultant (`owner`), Practice (`vertical`), and Payment Terms back to the Client Master database (`clients` table).
- **Role-Protected Exports**: Contracts Repository table Excel export is restricted to `admin` and `finance` roles only.

### 2. Tax Invoicing & Multi-Placement Billing
- **Candidate-First Selection & Governance**: Step 1 starts by selecting placed candidate(s), auto-resolving linked Mandate, Client, and signed Contract. Prevents orphan invoices.
- **Proposal Deck Fee Slab Auto-Matching**: Auto-calculates success fee % based on candidate CTC:
  - `CTC < ₹50 Lakhs` $\rightarrow$ **18%**
  - `CTC ₹50 Lakhs – ₹1 Crore` $\rightarrow$ **20%**
  - `CTC > ₹1 Crore` $\rightarrow$ **25%**
- **Multi-Placement Line Items (`+ Add Line Item`)**: Supports billing multiple candidate placements on a single Tax Invoice.
- **100% Editable Particulars Description**: Line descriptions default to *"Executive Search Professional Fee — Success fee (20%) for Placement against Annual CTC of ₹50 Lakhs"* and are fully editable per line.
- **Precise Tax Regime Splits**:
  - **Intra-State**: CGST 9% + SGST 9%
  - **Union Territory (DL, CH, PY, AN, LD, DN, JK, LA)**: CGST 9% + UTGST 9%
  - **Inter-State**: IGST 18%
- **Auto-Draft Placement Invoicing**: Moving a candidate pipeline stage to `offer-accepted`, `closed`, `Hired`, or `offer-sent` automatically drafts a tax invoice in the background and alerts the Finance team.
- **INR Number to Words**: Converts rupee invoice totals into official Indian currency words (e.g. *"Rupees Forty Five Lakh Sixty Thousand Only"*).
- **Credit Notes & Cancellations**: Full audit-logged invoice cancellation and Credit Note issuing (`CN-MK-IN-YYYY-NNNNN`).

### 3. Payment Ledger & Collections
- **Multi-Mode Payment Recording**: Record NEFT, RTGS, IMPS, Cheque, and UPI payments against invoices.
- **Partial Payments & Outstanding Balance**: Tracks cumulative paid vs. outstanding amounts.
- **Payment Reversals**: Full audit-logged reversal of payment entries.

### 4. Compliance & Risk Monitoring
- **Real-Time Compliance Red Flags**:
  - Active mandates in last 12 months without a signed contract.
  - Expired contracts pending renewal.
  - Clients missing GST numbers.
  - Overdue collection accounts (>30 days).
  - Pending contract approvals.

### 5. Analytics, Query Parallelization & Excel Export
- **Parallel Query Engine**: Drizzle DB queries parallelized using `Promise.all()` for 5x faster page loads across compliance and reporting routes.
- **Bulk Excel Export**: One-click `.xlsx` export for Invoice Repository, Contract Repository, and Payment Ledger.
- **AI Assistant**: Natural language query engine (`askLegalFinanceQuery`) and contract risk analyzer (`analyzeContractRisks`).

---

## Database Relational Model

```
clients (id) ◄─── (clientId) ─── contracts (id) ◄─── (contractId) ─── contract_documents (id)
    ▲                               ▲
    │                               │
    └─────────────── (clientId) ────┼─── invoices (id) ◄─── (invoiceId) ─── invoice_payments (id)
                                    │        │
                                mandates (id)│ (lineItems JSON array)
                                    ▲        │
                                    └──── candidates (id)
```

---

## Migrations Applied

- `0032_legal_finance_foundation.sql`: Core tables (`contracts`, `invoices`, `invoice_payments`, `lf_audit_logs`, `lf_sequences`).
- `0033_contract_enhanced_fields.sql`: Added `signing_authority_client`, `signing_authority_mk`, `ctc_slabs`, `custom_clauses`.
- `0034_invoice_line_items_and_tax.sql`: Added `line_items`, `utgst_amount`, `tax_type`.

---

## Automated Cron Jobs (`vercel.json`)

| Path | Schedule | Description |
| :--- | :--- | :--- |
| `/api/internal/contract-renewal-reminders` | `0 8 * * *` | Sends renewal alerts at 60, 45, 30, 15, and 7 days prior to contract expiration. |
| `/api/internal/invoice-reminders` | `30 8 * * *` | Marks unpaid invoices as `Overdue` past due date and notifies Finance team. |

---

## Security & Audit Trail
- **Role-Based Access Control**: Enforced via `requireRole(["admin", "consultant", "finance"])`.
- **Immutable Audit Trail**: All state changes log directly into `lf_audit_logs` with actor details, previous values, and change reasons.
