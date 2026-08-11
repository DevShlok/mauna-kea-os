# Legal & Finance Module Architecture & Documentation

## Overview
The **Legal & Finance Module** provides enterprise-grade commercial contract lifecycle management, automated tax invoicing (GST/IGST/CGST split), payment collection ledgers, compliance risk monitoring, revenue reporting, and AI-assisted financial query handling.

---

## Key Features & Capabilities

### 1. Contract Management
- **Commercial Contract Registry**: Track commercial agreements, start/end dates, success fee %, retainer amounts, replacement guarantee periods, and non-poaching lock-in clauses.
- **Contract Creation Wizard**: 4-step wizard for client selection, fee structuring, governance clauses, and approval submission.
- **Version Control & Renewals**: Parent-child version history (`parent_contract_id`) allowing contract renewals without mutating historical records.
- **Signed Copy History**: Append-only storage (`contract_documents`) for executed PDF contracts.

### 2. Tax Invoicing & Fee Calculation
- **Auto-Calculated Tax Invoices**: Automated base fee, GST (18%), CGST (9%), SGST (9%), and IGST (18%) calculations based on client place of supply.
- **Auto-Draft Placement Invoicing**: Moving a candidate pipeline stage to `offer-accepted`, `closed`, or `Hired` automatically drafts a tax invoice in the background and alerts the Finance team.
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
                                    │
                                mandates (id)
```

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
