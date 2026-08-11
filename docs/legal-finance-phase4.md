# Legal & Finance Module — Phase 4
## Payment Tracking · Revenue Reports · Compliance Dashboard · AI Features

**Status:** Planning  
**Depends on:** Phase 1, Phase 2, Phase 3  
**This is the final phase** — delivers full operational completeness  

---

## 1. Objective

Complete the Legal & Finance module with:

1. **Payment Tracking** — record payments, partial payments, reversals; auto-update invoice status
2. **Revenue Reports** — multi-dimensional analytics (by client, consultant, practice, period)
3. **Compliance Dashboard** — single view of all red flags (no contract, expired contract, missing GST, pending approvals, overdue)
4. **Collection Dashboard** — aging analysis, DSO tracking, top debtors
5. **AI Assistant** — natural language queries, contract risk detection, payment prediction, duplicate detection
6. **Bulk Operations** — bulk export, bulk reminder, bulk payment update
7. **Audit Log UI** — dedicated filterable audit trail page

---

## 2. Existing System Context

### 2.1 `invoice_payments` table (from Phase 1 schema)

```ts
// Supports: one invoice → many payment records
// Supports: partial payments (amount < invoice total)
// Supports: reversals (is_reversed = true, reversal_reason)
// Each INSERT recomputes invoice.amount_paid and invoice.amount_outstanding
```

### 2.2 `lf_audit_logs` table (from Phase 1 schema)

```ts
// Immutable — INSERT only from application code
// Used to power the Audit Log UI in Phase 4
// Indexed on: (entity_type, entity_id), action, actor_name, timestamp
```

### 2.3 Analytics Pattern

```ts
// src/features/analytics/ — existing analytics page
// Uses server-side Drizzle aggregate queries
// Phase 4 revenue reports follow the same pattern
// No external BI tool needed; queries run server-side via Next.js Server Components
```

### 2.4 Existing `consultantNotifications` Table

```ts
// Already supports targetRole broadcast (targetRole='finance' reaches all finance users)
// Phase 4 compliance alerts use this same mechanism
```

---

## 3. Payment Tracking

### 3.1 Server Actions (add to `src/actions/legal-finance.ts`)

#### `recordPaymentAction`

```ts
export async function recordPaymentAction(data: {
  invoiceId: string;
  paymentDate: string;
  amount: number;
  referenceNumber?: string;
  utrNumber?: string;
  mode?: string;
  notes?: string;
}) {
  const { platformUser } = await requireRole(["admin", "finance"]);
  const actorName = await getCurrentUserName();

  // Fetch invoice
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, data.invoiceId));
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "Cancelled") throw new Error("Cannot record payment on a cancelled invoice.");

  // Insert payment record
  await db.insert(invoicePayments).values({
    invoiceId: data.invoiceId,
    paymentDate: data.paymentDate,
    amount: data.amount,
    referenceNumber: data.referenceNumber || null,
    utrNumber: data.utrNumber || null,
    mode: data.mode || null,
    notes: data.notes || null,
    recordedBy: actorName,
  });

  // Recalculate invoice aggregate
  const allPayments = await db.select({ amount: invoicePayments.amount, isReversed: invoicePayments.isReversed })
    .from(invoicePayments)
    .where(eq(invoicePayments.invoiceId, data.invoiceId));

  const totalPaid = allPayments
    .filter(p => !p.isReversed)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const outstanding = (invoice.totalAmount || 0) - totalPaid;

  let newStatus: string;
  if (totalPaid <= 0) newStatus = invoice.status || "Shared";
  else if (outstanding <= 0.01) newStatus = "Paid";
  else newStatus = "Partially Paid";

  await db.update(invoices).set({
    amountPaid: totalPaid,
    amountOutstanding: Math.max(0, outstanding),
    status: newStatus,
    updatedAt: new Date(),
  }).where(eq(invoices.id, data.invoiceId));

  await writeLfAuditLog({
    entityType: "payment",
    entityId: data.invoiceId,
    action: "payment_recorded",
    actorName,
    actorRole: platformUser?.role,
    newValue: {
      amount: data.amount,
      mode: data.mode,
      utr: data.utrNumber,
      newStatus,
      totalPaid,
    },
  });

  revalidatePath("/dashboard/legal-finance/invoices");
  revalidatePath("/dashboard/legal-finance/payments");
  return { newStatus, totalPaid, outstanding: Math.max(0, outstanding) };
}
```

#### `reversePaymentAction`

```ts
export async function reversePaymentAction(paymentId: number, reason: string) {
  const { platformUser } = await requireRole(["admin", "finance"]);
  const actorName = await getCurrentUserName();

  if (!reason?.trim()) throw new Error("Reversal reason is mandatory.");

  const [payment] = await db.select().from(invoicePayments).where(eq(invoicePayments.id, paymentId));
  if (!payment) throw new Error("Payment record not found");
  if (payment.isReversed) throw new Error("Payment is already reversed.");

  await db.update(invoicePayments).set({
    isReversed: true,
    reversedAt: new Date(),
    reversedBy: actorName,
    reversalReason: reason,
  }).where(eq(invoicePayments.id, paymentId));

  // Recalculate invoice status (same logic as recordPaymentAction)
  const allPayments = await db.select({ amount: invoicePayments.amount, isReversed: invoicePayments.isReversed })
    .from(invoicePayments).where(eq(invoicePayments.invoiceId, payment.invoiceId));

  const totalPaid = allPayments
    .filter(p => !p.isReversed)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, payment.invoiceId));
  const outstanding = (invoice?.totalAmount || 0) - totalPaid;
  const newStatus = outstanding <= 0.01 ? "Paid" : totalPaid > 0 ? "Partially Paid" : "Shared";

  await db.update(invoices).set({
    amountPaid: totalPaid,
    amountOutstanding: Math.max(0, outstanding),
    status: newStatus,
    updatedAt: new Date(),
  }).where(eq(invoices.id, payment.invoiceId));

  await writeLfAuditLog({
    entityType: "payment",
    entityId: payment.invoiceId,
    action: "payment_reversed",
    actorName,
    actorRole: platformUser?.role,
    changeReason: reason,
    previousValue: { amount: payment.amount, paymentId },
  });

  revalidatePath("/dashboard/legal-finance/invoices");
}
```

### 3.2 Payments Page (`PaymentsClient.tsx`)

**Route:** `src/app/dashboard/legal-finance/payments/page.tsx`
**Location:** `src/features/legal-finance/payments/components/PaymentsClient.tsx`

**Layout:**
- Stat strip: Total Collected This Month | Total Overdue | Avg Payment Days | Collection Rate %
- Filter: Date range | Client | Consultant | Status
- Table: Invoice No. | Client | Candidate | Amount | Paid | Outstanding | Due Date | Days Outstanding | Status | Record Payment (button) | History

**Record Payment Flow:**
- Clicking "Record Payment" on any Shared/Partial row opens a modal
- Modal fields: Payment Date, Amount (pre-filled with outstanding), Reference No., UTR, Mode (NEFT/RTGS/IMPS/Cheque/Cash), Notes
- On submit: calls `recordPaymentAction`
- If amount = outstanding → status auto-moves to "Paid"
- If amount < outstanding → status stays "Partially Paid"

**Payment History Modal:**
- List of all payment entries for the invoice
- Each entry: Date | Amount | Mode | UTR | Recorded By | [Reverse button (Admin/Finance only)]

---

## 4. Revenue Reports

**Route:** `src/app/dashboard/legal-finance/reports/page.tsx`

**Sub-report tabs:**

### 4.1 Revenue Overview

Stats:
- Total Billed (this FY) | Total Collected | Total Outstanding | Overdue (>30 days)
- Monthly trend bar chart (12 months): Billed vs Collected
- Financial Year selector (FY25, FY26, etc.)

Query:
```ts
// Monthly billed by invoice date
SELECT 
  DATE_TRUNC('month', invoice_date) as month,
  SUM(total_amount) as billed,
  SUM(amount_paid) as collected
FROM invoices
WHERE is_deleted = false AND status NOT IN ('Cancelled')
  AND invoice_date >= '2026-04-01' AND invoice_date < '2027-04-01'
GROUP BY month
ORDER BY month
```

### 4.2 Revenue by Client

Table: Client | Invoices Count | Total Billed | Total Paid | Outstanding | Last Invoice | Last Payment | Avg Payment Days

Sorted by Total Billed desc.

### 4.3 Revenue by Consultant

Table: Consultant | Invoices Count | Total Billed | Total Collected | Commission (if applicable)

### 4.4 Revenue by Practice

Same structure as by Consultant, grouped by `mandate.sectors[0]` or contract.practice.

### 4.5 Outstanding & Aging

Classic aging buckets:
```
Current (0–30 days) | 31–60 days | 61–90 days | 91–120 days | >120 days
```

Each bucket shows: Count of invoices, Total Amount, Clients affected.

Query:
```ts
SELECT 
  client_id,
  SUM(CASE WHEN CURRENT_DATE - due_date <= 30 THEN amount_outstanding ELSE 0 END) as bucket_0_30,
  SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 31 AND 60 THEN amount_outstanding ELSE 0 END) as bucket_31_60,
  SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 61 AND 90 THEN amount_outstanding ELSE 0 END) as bucket_61_90,
  SUM(CASE WHEN CURRENT_DATE - due_date > 90 THEN amount_outstanding ELSE 0 END) as bucket_90_plus
FROM invoices
WHERE status NOT IN ('Paid', 'Cancelled') AND is_deleted = false
GROUP BY client_id
```

### 4.6 GST Collection Report

Table: Month | Total Fee (excl. GST) | CGST Collected | SGST Collected | IGST Collected | Total GST | TDS Deducted

### 4.7 Collection Dashboard

- DSO (Days Sales Outstanding) = (Outstanding / Revenue for period) × Days in period
- Top 10 debtors by amount outstanding
- Accounts at risk: clients with no payment in >60 days
- Replacement liability: active contracts with replacement period not yet expired

---

## 5. Compliance Dashboard

**Route:** `src/app/dashboard/legal-finance/compliance/page.tsx`

**Add to sidebar:**
```ts
{ label: "Compliance", href: "/dashboard/legal-finance/compliance", visibleTo: ["admin", "finance"] }
```

**Seven compliance check cards:**

### 5.1 Clients Without Signed Contract
```ts
// Clients with at least 1 mandate in the last 12 months
// but NO contract with status='Signed' and is_deleted=false
SELECT c.id, c.name
FROM clients c
JOIN mandates m ON m.client_id = c.id
LEFT JOIN contracts con ON con.client_id = c.id AND con.status = 'Signed' AND con.is_deleted = false
WHERE m.is_deleted = false AND m.created_at > NOW() - INTERVAL '12 months'
GROUP BY c.id, c.name
HAVING COUNT(con.id) = 0
```

### 5.2 Expired Contracts
```ts
SELECT * FROM contracts
WHERE status = 'Signed' AND contract_end_date < CURRENT_DATE AND is_deleted = false
```
→ Shown as red count badge. Table: Client | Contract No. | Expired On | Consultant | Actions (Renew)

### 5.3 Invoices Without Valid Contract
```ts
SELECT i.* FROM invoices i
LEFT JOIN contracts con ON con.id = i.contract_id AND con.status = 'Signed'
WHERE i.is_deleted = false AND i.status NOT IN ('Cancelled') AND con.id IS NULL
```

### 5.4 Missing GST/PAN
```ts
SELECT id, name FROM clients
WHERE (gst_number IS NULL OR gst_number = '') AND is_deleted = false
```

### 5.5 Missing Purchase Orders
```ts
SELECT i.* FROM invoices i
JOIN clients c ON c.id = i.client_id
WHERE c.requires_po = true AND (i.po_number IS NULL OR i.po_number = '')
  AND i.is_deleted = false AND i.status NOT IN ('Cancelled')
```

### 5.6 Pending Approvals
```ts
SELECT * FROM contracts
WHERE approval_status IN ('Pending', 'ApprovedByBH') AND is_deleted = false
```

### 5.7 Overdue Collections (>30 days)
```ts
SELECT * FROM invoices
WHERE status = 'Overdue' AND (CURRENT_DATE - due_date) > 30 AND is_deleted = false
```

**Each compliance card:** Shows count badge (red/amber/green). Click → drill-down table.

---

## 6. AI Features

**Implementation strategy:** Server Actions that call the existing AI infrastructure (OpenAI/Gemini API already configured for AI Workbench). Each AI action is a separate server action that takes structured data and returns structured analysis.

**Location:** `src/actions/legal-finance-ai.ts`

### 6.1 Natural Language Query (`askLegalFinanceQuery`)

```ts
export async function askLegalFinanceQuery(query: string): Promise<{
  answer: string;
  data?: any[];
  sqlUsed?: string;
}> {
  await requireRole(["admin", "finance"]);
  
  // Prompt: given the schema for contracts, invoices, clients, mandate, candidates
  // translate the natural language query to a Drizzle-compatible filter and return structured results
  
  // Example queries handled:
  // "Show all clients with 22% commercials"
  //   → contracts where success_fee_pct = 22, return client names
  // "Which contracts expire in the next 60 days?"
  //   → contracts where contract_end_date BETWEEN today AND today+60
  // "How much revenue billed but not collected this quarter?"
  //   → SUM(amount_outstanding) WHERE invoice_date >= quarter_start
  // "List invoices overdue by more than 30 days"
  //   → status=Overdue AND CURRENT_DATE - due_date > 30
}
```

**UI:** A search-bar-style AI query input at the top of the Reports page. Results rendered as auto-formatted table or number card.

### 6.2 Contract Risk Analysis (`analyzeContractRisks`)

```ts
export async function analyzeContractRisks(contractId: string): Promise<{
  risks: { severity: 'high' | 'medium' | 'low'; message: string }[];
  missingFields: string[];
  deviationsFromTemplate: string[];
}> {
  await requireRole(["admin", "consultant", "finance"]);
  
  const [contract] = await db.select().from(contracts).where(eq(contracts.id, contractId));
  
  // Rule-based checks (no AI needed for most):
  const risks = [];
  if (!contract.signedDocUrl) risks.push({ severity: 'high', message: 'No signed copy uploaded' });
  if (!contract.clientSnapshot?.gstNumber) risks.push({ severity: 'high', message: 'Client GST missing from contract snapshot' });
  if (!contract.paymentTerms) risks.push({ severity: 'medium', message: 'Payment terms not specified' });
  if (!contract.replacementPeriod) risks.push({ severity: 'medium', message: 'Replacement clause not defined' });
  if (contract.nonPoachingMonths === 0) risks.push({ severity: 'low', message: 'No non-poaching clause' });
  
  const today = new Date();
  const endDate = new Date(contract.contractEndDate);
  const daysLeft = Math.floor((endDate.getTime() - today.getTime()) / 86400000);
  if (daysLeft < 30 && contract.status === 'Signed') {
    risks.push({ severity: 'high', message: `Contract expires in ${daysLeft} days — renewal required` });
  }

  // AI-enhanced: send contract snapshot to LLM for clause detection
  // (only if signed document text available via OCR in future phases)
  
  return { risks, missingFields: [], deviationsFromTemplate: [] };
}
```

### 6.3 Payment Prediction (`predictCollectionRisk`)

```ts
export async function predictCollectionRisk(clientId: string): Promise<{
  riskLevel: 'low' | 'medium' | 'high';
  avgPaymentDays: number;
  overdueHistory: number;
  recommendation: string;
}> {
  await requireRole(["admin", "finance"]);
  
  // Analyse historical payment behavior for this client:
  // 1. Fetch all paid invoices for this client
  // 2. Compute avg days from invoice_date to payment date (from invoice_payments)
  // 3. Count overdue episodes
  // 4. Classify risk and generate recommendation text
  
  const paidInvoices = await db.select({
    invoiceDate: invoices.invoiceDate,
    dueDate: invoices.dueDate,
  }).from(invoices)
    .where(and(
      eq(invoices.clientId, clientId),
      eq(invoices.status, "Paid"),
    ));

  // Average days to payment: from payment records
  // ... compute logic ...
  
  return {
    riskLevel: avgDays > 60 ? 'high' : avgDays > 30 ? 'medium' : 'low',
    avgPaymentDays: avgDays,
    overdueHistory: overdueCount,
    recommendation: `This client typically pays in ${avgDays} days. ${overdueCount > 2 ? 'Follow up early.' : 'Low collection risk.'}`,
  };
}
```

### 6.4 Renewal Draft Generation (`generateRenewalDraft`)

```ts
export async function generateRenewalDraft(contractId: string): Promise<{
  draftData: Partial<typeof contracts.$inferInsert>;
  proposedChanges: { field: string; current: any; proposed: any; reason: string }[];
}> {
  await requireRole(["admin", "consultant", "finance"]);
  
  const [contract] = await db.select().from(contracts).where(eq(contracts.id, contractId));
  
  // Carry forward all terms from latest version
  // Auto-propose new dates: start = old end + 1 day, end = start + 1 year
  const newStart = new Date(contract.contractEndDate);
  newStart.setDate(newStart.getDate() + 1);
  const newEnd = new Date(newStart);
  newEnd.setFullYear(newEnd.getFullYear() + 1);
  
  return {
    draftData: {
      ...contract,
      id: undefined,
      contractNumber: undefined,
      contractStartDate: newStart.toISOString().split("T")[0],
      contractEndDate: newEnd.toISOString().split("T")[0],
      status: "Draft",
      version: (contract.version || 1) + 1,
      parentContractId: contractId,
      signedDocUrl: null,
      approvalStatus: "Pending",
      approvedBy: null,
      approvedAt: null,
    },
    proposedChanges: [
      { field: "Contract Start Date", current: contract.contractStartDate, proposed: newStart.toISOString().split("T")[0], reason: "Auto-calculated from expiry" },
      { field: "Contract End Date", current: contract.contractEndDate, proposed: newEnd.toISOString().split("T")[0], reason: "1-year renewal" },
    ],
  };
}
```

### 6.5 Contract Snapshot Card (`getContractSnapshot`)

```ts
export async function getContractSnapshot(contractId: string): Promise<{
  client: string;
  commercial: string;
  replacement: string;
  payment: string;
  currency: string;
  gst: string;
  expiry: string;
  keyRisks: string[];
}> {
  // Returns a pre-formatted summary suitable for the "Contract Snapshot" card UI
  // Used in both Contract Detail and Client page
}
```

---

## 7. Bulk Operations

### 7.1 Bulk Invoice Export

**Location:** "Export" button on Invoice Repository page

Options:
- Export All (filtered view) → Excel
- Export Selected → Excel/PDF zip

```ts
export async function exportInvoicesAction(filters: {
  status?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  consultant?: string;
}): Promise<string> {
  // Returns a pre-signed Supabase Storage URL to the generated Excel file
  // Excel columns: Invoice No | Client | Candidate | Mandate | Amount | GST | Total | Due Date | Status | Days Outstanding | Consultant
}
```

### 7.2 Bulk Reminder Send

**Location:** Invoice Repository — checkbox rows → "Send Reminder" bulk action button

```ts
export async function sendBulkRemindersAction(invoiceIds: string[]): Promise<void> {
  // For each invoice: generate reminder notification + audit log
  // Batched to avoid overwhelming the notification table
}
```

### 7.3 Bulk Contract Export

Same pattern as invoice export, triggered from Contract Repository.

---

## 8. Dedicated Audit Log UI

**Route:** `src/app/dashboard/legal-finance/audit-log/page.tsx`

**Add to sidebar:**
```ts
{ label: "Audit Log", href: "/dashboard/legal-finance/audit-log", visibleTo: ["admin", "finance"] }
```

**Page layout:**
- Filter bar: Entity Type (Contract/Invoice/Payment/Client) | User | Date Range | Action Type | Search
- Table: Entity Type | Entity ID (link) | Action | Actor | Date/Time | Previous Value | New Value | Reason

**Security:** This page is READ-ONLY. No edit/delete controls rendered. Server-side query enforces no mutation.

```ts
// src/db/queries.ts — getLfAuditLogsPaginated
export async function getLfAuditLogsPaginated(params: {
  page: number;
  pageSize: number;
  entityType?: string;
  actorName?: string;
  action?: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  // Returns paginated lf_audit_logs ordered by timestamp DESC
  // Previous/new values displayed as formatted diff: old value → new value
}
```

---

## 9. Updated Sidebar (Final State)

```ts
{
  title: "Legal & Finance",
  icon: Scale,
  visibleTo: ["admin", "consultant", "finance"],
  children: [
    { label: "Contracts",          href: "/dashboard/legal-finance/contracts",     visibleTo: ["admin", "consultant", "finance"] },
    { label: "Invoices",           href: "/dashboard/legal-finance/invoices",       visibleTo: ["admin", "finance"] },
    { label: "Payments",           href: "/dashboard/legal-finance/payments",       visibleTo: ["admin", "finance"] },
    { label: "Reports",            href: "/dashboard/legal-finance/reports",        visibleTo: ["admin", "finance"] },
    { label: "Compliance",         href: "/dashboard/legal-finance/compliance",     visibleTo: ["admin", "finance"] },
    { label: "Audit Log",          href: "/dashboard/legal-finance/audit-log",      visibleTo: ["admin", "finance"] },
  ]
},
```

---

## 10. File Checklist

| # | File | Action |
|---|------|--------|
| 1 | `src/actions/legal-finance.ts` | Add recordPaymentAction, reversePaymentAction |
| 2 | `src/actions/legal-finance-ai.ts` | NEW — all AI server actions |
| 3 | `src/db/queries.ts` | Add getPaymentsPaginated, getRevenueByClient, getLfAuditLogsPaginated, getComplianceStats |
| 4 | `src/features/legal-finance/payments/components/PaymentsClient.tsx` | NEW |
| 5 | `src/features/legal-finance/payments/components/RecordPaymentModal.tsx` | NEW |
| 6 | `src/features/legal-finance/payments/components/PaymentHistoryModal.tsx` | NEW |
| 7 | `src/features/legal-finance/reports/components/ReportsClient.tsx` | NEW |
| 8 | `src/features/legal-finance/reports/components/RevenueChart.tsx` | NEW — chart component |
| 9 | `src/features/legal-finance/reports/components/AgingTable.tsx` | NEW |
| 10 | `src/features/legal-finance/compliance/components/ComplianceClient.tsx` | NEW |
| 11 | `src/features/legal-finance/audit-log/components/AuditLogClient.tsx` | NEW |
| 12 | `src/app/dashboard/legal-finance/payments/page.tsx` | NEW |
| 13 | `src/app/dashboard/legal-finance/reports/page.tsx` | NEW |
| 14 | `src/app/dashboard/legal-finance/compliance/page.tsx` | NEW |
| 15 | `src/app/dashboard/legal-finance/audit-log/page.tsx` | NEW |
| 16 | `src/components/shared/Sidebar.tsx` | MODIFY — add Compliance + Audit Log nav items |
| 17 | `src/features/legal-finance/contracts/components/ContractDetailClient.tsx` | MODIFY — add risk analysis sidebar |

---

## 11. Permission Matrix (Complete)

| Action | Admin | Consultant | Finance |
|--------|-------|------------|---------|
| Record payment | ✅ | ❌ | ✅ |
| Reverse payment | ✅ | ❌ | ✅ |
| View reports | ✅ | ❌ | ✅ |
| View compliance | ✅ | ❌ | ✅ |
| Export invoices | ✅ | ✅ | ✅ |
| View audit log | ✅ | ❌ | ✅ |
| AI queries | ✅ | ❌ | ✅ |
| Bulk reminders | ✅ | ❌ | ✅ |

---

## 12. Revenue Recognition Logic

```ts
// Three recognition dates:
// 1. invoice_date — when fee was billed
// 2. joining_date — when candidate actually joined
// 3. payment_date — when cash received (from invoice_payments)

// For financial reporting, revenue can be recognised by any of the three:
// Standard accounting practice: recognize at joining_date
// Cash basis: recognize at payment_date
// Reports offer a toggle: "Accrual (Invoice Date) | Recognition (Joining Date) | Cash (Payment Date)"
```

---

## 13. Multi-Currency Support (Phase 4.5 — Future)

**Current state:** All amounts stored in native currency with `currency` field.
**Phase 4 delivers:** UI shows currency symbol (₹/$/€), amounts stored as-is.
**Phase 4.5 (future):** Exchange rate table + conversion to base currency (INR) for aggregates. Design the schema to support this without breaking Phase 4 data.

```sql
-- Future table (not in Phase 4 migration):
CREATE TABLE exchange_rates (
  id          SERIAL PRIMARY KEY,
  from_ccy    VARCHAR(10) NOT NULL,
  to_ccy      VARCHAR(10) NOT NULL DEFAULT 'INR',
  rate        DOUBLE PRECISION NOT NULL,
  effective_date DATE NOT NULL,
  source      VARCHAR(100)
);
```

---

## 14. Integration Design for External Systems (Future)

**API endpoints designed but not implemented in Phase 4:**

```
GET  /api/v1/invoices                → paginated invoice list (for ERP integration)
GET  /api/v1/invoices/{id}           → single invoice (Tally/Zoho push)
POST /api/v1/invoices/{id}/payment   → record payment via API (bank webhook)
GET  /api/v1/contracts               → contract list
GET  /api/v1/reports/revenue         → revenue summary
```

These routes, when built, use the same Drizzle queries already powering the UI. The auth mechanism will use API keys stored in `platform_users` with role=`api` (future).

---

## 15. Final Phase 4 Testing Checklist

- [ ] `recordPaymentAction` correctly updates `amountPaid`, `amountOutstanding`, and `status` atomically
- [ ] Partial payment leaves status as "Partially Paid"; full payment sets "Paid"
- [ ] Payment reversal restores correct outstanding amount and status
- [ ] Revenue reports show correct aggregates vs raw DB values
- [ ] Aging buckets sum to total outstanding
- [ ] Compliance dashboard counts match DB queries exactly
- [ ] Audit log shows all actions — nothing is missing or duplicated
- [ ] AI natural language query returns plausible results for sample questions
- [ ] Contract risk analysis flags missing signed copy / missing GST correctly
- [ ] Bulk export generates valid Excel file
- [ ] All new routes protected by `requireRole(["admin","finance"])` on server
- [ ] `npx tsc --noEmit` passes across all phases
- [ ] No existing mandate, client, candidate, or float workflows broken
- [ ] Finance user can log in and see Legal & Finance sidebar, but not Candidates/Float List/Frameworks
- [ ] Soft delete enforced everywhere — no hard DELETE statements in legal-finance actions
