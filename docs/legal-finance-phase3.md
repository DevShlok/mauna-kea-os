# Legal & Finance Module — Phase 3
## Invoice Management — Full Implementation

**Status:** Planning  
**Depends on:** Phase 1 (schema, libs), Phase 2 (contracts, commercial terms)  
**Next phase:** Phase 4 — Payments, Reports & Compliance Dashboard  

---

## 1. Objective

Deliver the complete Invoice Management module:

1. **Raise Invoice** — auto-populated from mandate + candidate + signed contract
2. **Invoice Repository** — searchable, paginated table with status tabs (matching sample screenshot)
3. **Invoice Detail View** — split-panel: left metadata, right professional PDF preview
4. **Professional Tax Invoice PDF** — matching MK brand, GST-compliant, HSN/SAC coded
5. **Invoice Editing & Versioning** — edit before share, version history, mandatory reason for edit
6. **Invoice Cancellation** — watermarked CANCELLED; no hard delete
7. **Credit Notes** — generated against an invoice, auto-linked
8. **Automated Reminders** — 7 days before due, due date, 7/15/30 days after overdue
9. **Client Page Integration** — financial summary strip on client page
10. **Mandate Workflow Integration** — "Raise Invoice" button activates when mandate stage reaches offer-accepted/joined

---

## 2. Existing System Context

### 2.1 Mandate Stages & Internal Status

```ts
// src/lib/helpers.ts
export const STAGE_LABELS = {
  'offer-accepted': 'Offer Accepted',
  closed: 'Closed',
  ...
};
export const INTERNAL_LABELS = {
  contractsent: 'Contract Sent',
  contractsigned: 'Contract Signed',
  invoicesent: 'Invoice Sent',
  paymentreceived: 'Payment Received',
  followup: 'Follow Up',
};
```

The "Raise Invoice" button activates when:
- `mandate.status` is `offer-accepted` or `closed`
- OR `mandate.internalStatus` is `contractsigned` or `invoicesent`
- AND no non-cancelled invoice already exists for this mandate (duplicate check)

### 2.2 Mandate Candidate Stage

```ts
// mandateCandidates.stage values include:
// 'offer-accepted' — candidate has accepted the offer
// 'closed' — position closed / candidate placed
// This is what triggers invoice eligibility
```

### 2.3 How the Client Data Is Fetched

```ts
// The invoice auto-populates by:
// 1. mandate.clientId → fetch client record (full legal/billing data from Phase 1)
// 2. mandate.id → fetch the active signed contract for this client
//    (WHERE client_id = mandate.clientId AND status = 'Signed' ORDER BY created_at DESC LIMIT 1)
// 3. mandateCandidate where stage='offer-accepted' → candidate's CTC
// 4. Compute: fee = annualCtc × commercialPct / 100
//             gstAmount = fee × gstRate / 100
//             totalAmount = fee + gstAmount
```

### 2.4 How Notifications Work (Existing)

```ts
// src/db/schema.ts — consultantNotifications
// Already used by the Topbar bell icon
// For invoice reminders we insert into this table:
//   { targetRole: 'finance', message: '...', link: '/dashboard/legal-finance/invoices/INV-xxx' }
// Finance role users will see them in their bell
```

### 2.5 Pattern Used by MandateDetailClient.tsx

The mandate detail page already has an inline status update mechanism via `updateMandateFieldAction`. The "Raise Invoice" button we add to `MandateDetailClient.tsx` follows this same pattern — it's a button that calls a server action, not a page navigation.

### 2.6 Sample Invoice Fields (from screenshot analysis)

The sample invoice shows:
- Sender block: Mauna Kea International Pvt. Ltd., address, GSTIN, PAN
- Invoice metadata: Invoice No., Invoice Date, Due Date, Place of Supply
- Bill To / Ship To: Client legal name, address, GSTIN, PAN, Contact
- Line item: "Executive Search Fee — {Role} ({commercial}% of Annual CTC)" | HSN/SAC 998313 | Amount
- Sub Total, CGST (9%), SGST (9%) — or IGST (18%) for inter-state
- Total Amount
- Amount in Words
- Bank Details: HDFC, A/c, IFSC, Branch
- Terms: 4 standard clauses
- Authorised Signatory: Signature image + "For Mauna Kea International Pvt. Ltd."

---

## 3. Route Structure

```
src/app/dashboard/legal-finance/invoices/
├── page.tsx                   ← Invoice Repository (server, paginated)
├── new/
│   └── page.tsx              ← Raise Invoice form (server — fetches mandate options)
└── [id]/
    └── page.tsx              ← Invoice Detail (server)
```

---

## 4. Server Actions (add to `src/actions/legal-finance.ts`)

### 4.1 `raiseInvoiceAction`

```ts
export async function raiseInvoiceAction(data: {
  mandateId: number;
  candId: string;
  joiningDate?: string;
  overrideCommercialPct?: number;  // Finance override only
  poNumber?: string;
  invoiceDate?: string;
  notes?: string;
}) {
  const { platformUser } = await requireRole(["admin", "consultant", "finance"]);
  const actorName = await getCurrentUserName();

  // 1. Fetch mandate
  const [mandate] = await db.select().from(mandates)
    .where(and(eq(mandates.id, data.mandateId), eq(mandates.isDeleted, false)));
  if (!mandate) throw new Error("Mandate not found");

  // 2. Fetch candidate
  const [candidate] = await db.select().from(candidates)
    .where(eq(candidates.id, data.candId));
  if (!candidate) throw new Error("Candidate not found");

  // 3. Fetch client
  const [client] = await db.select().from(clients)
    .where(eq(clients.id, mandate.clientId!));
  if (!client) throw new Error("Client not found");

  // 4. Fetch signed contract (most recent)
  const [contract] = await db.select().from(contracts)
    .where(and(
      eq(contracts.clientId, client.id),
      eq(contracts.status, "Signed"),
      eq(contracts.isDeleted, false)
    ))
    .orderBy(desc(contracts.createdAt))
    .limit(1);

  // 5. Data integrity validation
  const validationErrors: string[] = [];
  if (!contract) validationErrors.push("No signed contract exists for this client.");
  if (!client.gstNumber) validationErrors.push("Client GST number is missing.");
  if (!client.billingAddress) validationErrors.push("Client billing address is missing.");
  if (!candidate.ctc) validationErrors.push("Candidate CTC is not recorded.");

  // Duplicate check
  const [existingInvoice] = await db.select({ id: invoices.id }).from(invoices)
    .where(and(
      eq(invoices.mandateId, data.mandateId),
      eq(invoices.candId, data.candId),
      sql`${invoices.status} NOT IN ('Cancelled')`,
    )).limit(1);
  if (existingInvoice) validationErrors.push("An active invoice already exists for this mandate and candidate.");

  if (validationErrors.length > 0 && platformUser?.role !== "admin") {
    throw new Error(validationErrors.join(" "));
  }

  // 6. Commercial calculation
  const annualCtc = candidate.ctc || 0;  // in Lakhs
  const commercialPct = data.overrideCommercialPct ?? contract?.successFeePct ?? 22;
  const feeBeforeTax = (annualCtc * 100000) * (commercialPct / 100); // convert to rupees
  const gstRate = (client as any).gstRate ?? 18;

  // Determine CGST/SGST vs IGST
  // If client state === MK registered state (Karnataka) → CGST+SGST, else IGST
  const mkState = "Karnataka";
  const clientState = (client as any).state || "";
  const isIntraState = clientState.toLowerCase() === mkState.toLowerCase();
  const gstAmount = feeBeforeTax * (gstRate / 100);
  const cgstAmount = isIntraState ? gstAmount / 2 : 0;
  const sgstAmount = isIntraState ? gstAmount / 2 : 0;
  const igstAmount = isIntraState ? 0 : gstAmount;
  const tdsRate = (client as any).tdsApplicable ? 10 : 0;
  const tdsAmount = feeBeforeTax * (tdsRate / 100);
  const totalAmount = feeBeforeTax + gstAmount;

  // 7. Client snapshot (frozen at invoice creation)
  const clientSnapshot = {
    name: client.name,
    legalEntityName: client.legalEntityName,
    gstNumber: (client as any).gstNumber,
    panNumber: (client as any).panNumber,
    billingAddress: (client as any).billingAddress,
    city: (client as any).city,
    state: (client as any).state,
    country: (client as any).country,
    pinCode: (client as any).pinCode,
    placeOfSupply: (client as any).placeOfSupply,
    contacts: client.contacts,
    financeEmail: (client as any).financeEmail,
  };

  const commercialSnapshot = {
    contractNumber: contract?.contractNumber,
    contractId: contract?.id,
    commercialStructure: contract?.commercialStructure,
    commercialPct,
    paymentTerms: contract?.paymentTerms || (client as any).defaultPaymentTerms,
    replacementPeriod: contract?.replacementPeriod,
  };

  // 8. Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();
  const invoiceId = newInvoiceId();
  const today = new Date();
  const invoiceDate = data.invoiceDate || today.toISOString().split("T")[0];
  
  // Due date: parse payment terms "30 Days from Invoice Date"
  const paymentTermDays = parseInt((contract?.paymentTerms || "30").replace(/\D/g, "")) || 30;
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + paymentTermDays);

  // 9. Insert invoice
  await db.insert(invoices).values({
    id: invoiceId,
    invoiceNumber,
    clientId: client.id,
    contractId: contract?.id,
    mandateId: mandate.id,
    candId: candidate.id,
    clientSnapshot,
    commercialSnapshot,
    invoiceDate,
    dueDate: dueDate.toISOString().split("T")[0],
    joiningDate: data.joiningDate || null,
    annualCtc: annualCtc,
    commercialPct,
    feeBeforeTax,
    gstRate,
    gstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    tdsRate,
    tdsAmount,
    totalAmount,
    amountOutstanding: totalAmount,
    currency: (client as any).currency || "INR",
    placeOfSupply: (client as any).placeOfSupply || clientState,
    hsnSacCode: "998313",
    poNumber: data.poNumber || null,
    status: "Draft",
    consultant: mandate.consultant,
    createdBy: actorName,
    version: 1,
    notes: data.notes || null,
  });

  // 10. Update mandate internalStatus
  await db.update(mandates)
    .set({ internalStatus: "invoicesent", updatedAt: new Date() } as any)
    .where(eq(mandates.id, mandate.id));

  // 11. Audit log
  await writeLfAuditLog({
    entityType: "invoice",
    entityId: invoiceId,
    action: "created",
    actorName,
    actorRole: platformUser?.role,
    newValue: { invoiceNumber, totalAmount, status: "Draft" },
  });

  revalidatePath("/dashboard/legal-finance/invoices");
  revalidatePath("/dashboard/mandates");
  return { id: invoiceId, invoiceNumber };
}
```

### 4.2 `updateInvoiceAction` (edit before share)

```ts
export async function updateInvoiceAction(
  invoiceId: string,
  data: Partial<typeof invoices.$inferInsert>,
  reason: string  // mandatory reason field
) {
  const { platformUser } = await requireRole(["admin", "finance"]);
  const actorName = await getCurrentUserName();

  const [existing] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  if (!existing) throw new Error("Invoice not found");

  // Lock check: only Draft and Generated (not yet Shared) are editable
  if (!["Draft", "Generated"].includes(existing.status || "")) {
    throw new Error("Invoice is locked. Create a revised invoice or credit note instead.");
  }

  if (!reason?.trim()) throw new Error("Edit reason is mandatory.");

  // Create a new version (archive the current, increment version)
  const prevVersion = existing.version || 1;
  const newVersion = prevVersion + 1;

  // Insert new invoice row as the current version
  const newId = newInvoiceId();
  const newInvoiceNumber = existing.invoiceNumber; // same number, new version

  await db.insert(invoices).values({
    ...existing,
    id: newId,
    version: newVersion,
    parentInvoiceId: existing.parentInvoiceId || invoiceId,
    ...data,
    status: "Draft",
    createdBy: actorName,
    updatedAt: new Date(),
    createdAt: new Date(),
  });

  // Mark old version as superseded (keep status, just note version superseded via audit)
  await writeLfAuditLog({
    entityType: "invoice",
    entityId: newId,
    action: "edited",
    actorName,
    actorRole: platformUser?.role,
    previousValue: { version: prevVersion, id: invoiceId },
    newValue: { version: newVersion, id: newId },
    changeReason: reason,
  });

  revalidatePath("/dashboard/legal-finance/invoices");
  return { id: newId, invoiceNumber: newInvoiceNumber, version: newVersion };
}
```

### 4.3 `shareInvoiceAction`

```ts
export async function shareInvoiceAction(invoiceId: string) {
  const { platformUser } = await requireRole(["admin", "finance"]);
  const actorName = await getCurrentUserName();

  await db.update(invoices).set({
    status: "Shared",
    updatedAt: new Date(),
  }).where(eq(invoices.id, invoiceId));

  await writeLfAuditLog({
    entityType: "invoice",
    entityId: invoiceId,
    action: "shared",
    actorName,
    actorRole: platformUser?.role,
  });

  // Schedule reminder notifications (insert into consultant_notifications for finance)
  // Reminder job picks these up daily; see Section 6
  revalidatePath("/dashboard/legal-finance/invoices");
}
```

### 4.4 `cancelInvoiceAction`

```ts
export async function cancelInvoiceAction(
  invoiceId: string,
  reason: string
) {
  const { platformUser } = await requireRole(["admin", "finance"]);
  const actorName = await getCurrentUserName();

  if (!reason?.trim()) throw new Error("Cancellation reason is mandatory.");

  await db.update(invoices).set({
    status: "Cancelled",
    cancelReason: reason,
    cancelBy: actorName,
    cancelledAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(invoices.id, invoiceId));

  await writeLfAuditLog({
    entityType: "invoice",
    entityId: invoiceId,
    action: "cancelled",
    actorName,
    actorRole: platformUser?.role,
    changeReason: reason,
  });

  revalidatePath("/dashboard/legal-finance/invoices");
}
```

### 4.5 `issueCreditNoteAction`

```ts
export async function issueCreditNoteAction(data: {
  originalInvoiceId: string;
  amount: number;
  reason: string;
  notes?: string;
}) {
  const { platformUser } = await requireRole(["admin", "finance"]);
  const actorName = await getCurrentUserName();

  const [original] = await db.select().from(invoices)
    .where(eq(invoices.id, data.originalInvoiceId));
  if (!original) throw new Error("Original invoice not found");

  const creditNoteNumber = await generateInvoiceNumber(); // Uses same sequence; distinguish by prefix later
  const creditNoteId = newInvoiceId();

  // Create credit note as a negative-value invoice linked to original
  await db.insert(invoices).values({
    id: creditNoteId,
    invoiceNumber: `CN-${creditNoteNumber}`,
    clientId: original.clientId,
    contractId: original.contractId,
    mandateId: original.mandateId,
    candId: original.candId,
    clientSnapshot: original.clientSnapshot,
    commercialSnapshot: original.commercialSnapshot,
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
    feeBeforeTax: -data.amount,
    gstRate: original.gstRate,
    gstAmount: -(original.gstRate ? data.amount * (original.gstRate / 100) : 0),
    totalAmount: -(data.amount + (original.gstRate ? data.amount * (original.gstRate / 100) : 0)),
    currency: original.currency,
    status: "Generated",
    parentInvoiceId: original.id,
    consultant: original.consultant,
    createdBy: actorName,
    version: 1,
    notes: `Credit Note against ${original.invoiceNumber}. Reason: ${data.reason}. ${data.notes || ""}`,
  });

  // Update original invoice status
  await db.update(invoices).set({
    status: "Credit Note Issued",
    updatedAt: new Date(),
  }).where(eq(invoices.id, original.id));

  await writeLfAuditLog({
    entityType: "invoice",
    entityId: creditNoteId,
    action: "cn_issued",
    actorName,
    actorRole: platformUser?.role,
    previousValue: { originalInvoiceId: original.id },
    newValue: { creditNoteId, amount: -data.amount },
    changeReason: data.reason,
  });

  revalidatePath("/dashboard/legal-finance/invoices");
  return { id: creditNoteId, creditNoteNumber: `CN-${creditNoteNumber}` };
}
```

### 4.6 `getInvoicesPaginated` (Query)

```ts
export async function getInvoicesPaginated(params: {
  page: number;
  pageSize: number;
  clientId?: string;
  status?: string;
  consultant?: string;
  search?: string;
  overdueOnly?: boolean;
}) {
  // ... same pattern as getContractsPaginated
  // Join: invoices ← clients, invoices ← mandates (for role/position), invoices ← candidates (for name)
  // Filter by status tabs: All | Draft | Generated | Shared | Paid | Partially Paid | Overdue | Cancelled
  // Overdue: status IN ('Shared','Partially Paid') AND due_date < TODAY
}
```

---

## 5. UI Components

### 5.1 Invoice Repository (`InvoicesClient.tsx`)

**Location:** `src/features/legal-finance/invoices/components/InvoicesClient.tsx`

**Status Tabs** (matching sample image):
`All Invoices | Draft | Generated | Shared | Paid | Partially Paid | Overdue | Cancelled`

**Action buttons (top right):**
- Export (Excel/CSV)
- + Raise Invoice (opens wizard)

**Filter bar:**
Search by invoice no. / client / candidate | All Clients | All Status | All Consultants | More Filters

**Table columns:**
```
Invoice No. | Client | Candidate (name + designation) | Invoice Date | Due Date | Amount (₹) | Status | Consultant | Actions (⋮)
```

**Status badge colour mapping:**
- Draft → grey `bg-gray-100 text-gray-600`
- Generated → blue `bg-blue-100 text-blue-700`
- Shared → indigo `bg-indigo-100 text-indigo-700`
- Paid → green `bg-green-100 text-green-700`
- Partially Paid → amber `bg-amber-100 text-amber-700`
- Overdue → red `bg-red-100 text-red-700`
- Cancelled → strikethrough, dark red
- Credit Note Issued → purple

**Row click → split-view:** clicking a row expands a bottom panel showing Invoice Details (left) and PDF Preview (right). This matches the exact layout shown in the sample screenshot.

**Split panel — left (Invoice Details):**
Invoice No. | Client (link) | Candidate | Mandate (link) | Position | Invoice Date | Due Date | PO Number | Currency | Place of Supply | Commercial % | Annual CTC | Fee (Before Tax) | GST Amount | Total Amount | Amount in Words | Payment Terms | Consultant | Created By | Last Updated By

**Split panel — right (PDF Preview):**
Live-rendered tax invoice PDF using `@react-pdf/renderer` or embedded iframe. Buttons: Download PDF | More Actions (Share, Cancel, Edit, Credit Note)

### 5.2 Raise Invoice Form (`RaiseInvoiceClient.tsx`)

**Location:** `src/features/legal-finance/invoices/components/RaiseInvoiceClient.tsx`

This is NOT a free-form entry screen. Everything is pre-filled; users only confirm.

**Step 1 — Select Mandate & Candidate**
- Mandate dropdown: shows all mandates with status=offer-accepted or status=closed
- Candidate dropdown: filtered to the selected mandate's candidates at stage offer-accepted
- On selection: auto-populate all fields below

**Auto-populated (read-only) fields:**
- Client Name, Legal Entity, GST, PAN, Billing Address, Contact
- Mandate: Role, Position, Joined Date
- Candidate: Name, CTC (Annual)
- Commercial %: pulled from active signed contract (read-only unless Finance user overrides)
- Calculation Preview: Fee Before Tax, CGST, SGST/IGST, TDS, Total
- Currency, Place of Supply, HSN/SAC

**Editable fields:**
- Invoice Date (defaults to today)
- PO Number (if client requires PO)
- Joining Date
- Notes

**Finance override:** Finance and Admin can edit Commercial % with mandatory reason.

**Data integrity warnings (shown inline, not blocking for Admin):**
- "No signed contract found for this client" → amber banner
- "Client GST number missing" → amber banner
- "Duplicate invoice detected" → red banner, blocks generation

### 5.3 Invoice Detail View (`InvoiceDetailClient.tsx`)

**Breadcrumb:** Invoices / MK-IN-2026-00045  
**Status badge:** top right  
**Action buttons:** Edit | Cancel Invoice | Share Invoice (with dropdown: Email, Copy Link)

**Left panel:** All metadata (same as split view fields above)  

**Right panel:** Live PDF preview with Download PDF button

**Version History tab:** Table showing all versions (V1, V2, V3) with action, user, date

**Audit Log tab:** All `lf_audit_logs` entries for this invoice

**Payments tab:** (Phase 4) — shown as "Record Payment" button and payments list

---

## 6. Tax Invoice PDF Template

**Structure matches sample screenshot exactly:**

```
┌────────────────────────────────────────────────────────────┐
│ [MK Logo]          MAUNA KEA INTERNATIONAL      TAX INVOICE│
│ Address block                                              │
│ GSTIN: XXXX | PAN: XXXX                                   │
├────────────────────┬───────────────────────────────────────┤
│ Bill To:           │ Ship To:                              │
│ {Client Legal Name}│ {Client Legal Name}                   │
│ {Address}          │ {Address}                             │
│ GSTIN: {gst}       │ GSTIN: {gst}                         │
│ Contact: {name}    │ Phone: {phone}                        │
├────────────────────┴───────────────────┬──────────────────┤
│                                        │ Invoice No.       │
│                                        │ Invoice Date      │
│                                        │ Due Date          │
│                                        │ Place of Supply   │
├──────────────────────────────────────────────────────────┤
│ # | Description             | HSN/SAC | Amount (₹)       │
│ 1 | Executive Search Fee —  | 998313  | ₹XX,XX,XXX       │
│   | {Role} ({pct}% Annual CTC)|       |                   │
├──────────────────────────────────────────────────────────┤
│                              Sub Total | ₹XX,XX,XXX       │
│                              CGST (9%) | ₹X,XX,XXX        │  ← intra-state
│                              SGST (9%) | ₹X,XX,XXX        │
│   OR  IGST (18%) for inter-state                         │
│                              ─────────────────────────── │
│                              Total     | ₹XX,XX,XXX       │
├──────────────────────────────────────────────────────────┤
│ Amount in Words: Rupees {words} Only                      │
├──────────────────────────────────────────────────────────┤
│ Bank Details:              │ Terms & Conditions:          │
│ Bank: HDFC Bank            │ 1. Payment within 30 days   │
│ A/c Name: Mauna Kea Int.   │ 2. TDS deductible           │
│ A/c No: {acct}             │ 3. Disputes: Bangalore juris│
│ IFSC: {ifsc}               │ 4. Computer generated invoice│
│ Branch: {branch}           │                              │
├──────────────────────────────────────────────────────────┤
│                            │ For Mauna Kea International  │
│                            │ [Signature image]            │
│                            │ Authorised Signatory         │
└──────────────────────────────────────────────────────────┘
```

**Implementation:** React PDF component at `src/features/legal-finance/invoices/components/InvoicePdf.tsx` using `@react-pdf/renderer`.

**Number to words conversion:** Use a utility function `src/lib/number-to-words.ts`:
```ts
// Handles Indian numbering: Rupees Twenty Six Lakhs Forty Thousand Only
export function amountToWords(amount: number): string { ... }
```

**CANCELLED watermark:** When status is `Cancelled`, overlay diagonal red "CANCELLED" text across the PDF.

---

## 7. Mandate Integration — "Raise Invoice" Button

**File:** `src/features/mandates/components/MandateDetailClient.tsx`

Add to the mandate detail action bar (after existing action buttons):

```tsx
{/* Show only when mandate is billable */}
{(mandate.status === 'offer-accepted' || mandate.status === 'closed') && (
  <button
    onClick={() => router.push(`/dashboard/legal-finance/invoices/new?mandateId=${mandate.id}`)}
    className="neo-btn-gold px-4 py-2 text-sm font-bold flex items-center gap-2"
  >
    <Receipt className="w-4 h-4" />
    Raise Invoice
  </button>
)}
```

The `/invoices/new` page receives `mandateId` as a query param, pre-selects it in the form.

---

## 8. Automated Invoice Reminders

**API Route:** `src/app/api/internal/invoice-reminders/route.ts`

Invoked by Vercel Cron Job (set in `vercel.json`):
```json
{
  "crons": [
    { "path": "/api/internal/invoice-reminders", "schedule": "0 9 * * *" },
    { "path": "/api/internal/contract-renewal-reminders", "schedule": "0 9 * * *" }
  ]
}
```

Logic:
1. Fetch all invoices with status `Shared` or `Partially Paid`
2. For each: compute `daysUntilDue` and `daysOverdue`
3. Check reminder thresholds: [-7, 0, +7, +15, +30] days relative to due date
4. If today matches a threshold AND no reminder sent at this threshold (check `lf_audit_logs`):
   - Insert into `consultantNotifications` for Finance role: `{ targetRole: 'finance', message, link }`
   - Also insert for the mandate's consultant
   - Write audit log: action=`reminder_sent`, metadata=`{ threshold: 7, type: 'due_soon' }`
5. Auto-mark overdue: if `dueDate < today` AND status is `Shared` → UPDATE status to `Overdue`

---

## 9. Client Page Financial Integration

**File:** `src/features/clients/components/ClientDetailClient.tsx`

The client page server fetch (`src/app/dashboard/clients/[id]/page.tsx`) already fetches mandates. Extend it to also fetch:

```ts
// Aggregate financial summary for this client
const invoiceSummary = await db.select({
  totalBilled: sql<number>`COALESCE(SUM(total_amount), 0)`,
  totalPaid: sql<number>`COALESCE(SUM(amount_paid), 0)`,
  totalOutstanding: sql<number>`COALESCE(SUM(amount_outstanding), 0)`,
  invoiceCount: sql<number>`COUNT(*)`,
}).from(invoices)
  .where(and(
    eq(invoices.clientId, client.id),
    eq(invoices.isDeleted, false),
    sql`${invoices.status} NOT IN ('Cancelled')`
  ));
```

Display as a financial stat strip on the client page:
```
Lifetime Revenue: ₹X Cr | Invoices Raised: N | Total Paid: ₹X Cr | Outstanding: ₹X L | Avg Payment: N days
```

Also add "Invoices" tab to client page tab bar, listing all invoices for the client.

---

## 10. Overdue Tracking & Days Outstanding

**Computed field (not stored):**
```ts
// Computed on the fly in the table display
const daysOutstanding = invoice.status !== 'Paid'
  ? Math.max(0, Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / 86400000))
  : 0;
```

Add `daysOutstanding` as a computed column in `InvoicesClient.tsx`.

---

## 11. File Checklist

| # | File | Action |
|---|------|--------|
| 1 | `src/actions/legal-finance.ts` | Add raiseInvoiceAction, updateInvoiceAction, shareInvoiceAction, cancelInvoiceAction, issueCreditNoteAction |
| 2 | `src/db/queries.ts` | Add getInvoicesPaginated |
| 3 | `src/features/legal-finance/invoices/components/InvoicesClient.tsx` | NEW |
| 4 | `src/features/legal-finance/invoices/components/RaiseInvoiceClient.tsx` | NEW |
| 5 | `src/features/legal-finance/invoices/components/InvoiceDetailClient.tsx` | NEW |
| 6 | `src/features/legal-finance/invoices/components/InvoicePdf.tsx` | NEW — @react-pdf/renderer |
| 7 | `src/lib/number-to-words.ts` | NEW — INR amount to words |
| 8 | `src/app/dashboard/legal-finance/invoices/page.tsx` | NEW — server page |
| 9 | `src/app/dashboard/legal-finance/invoices/new/page.tsx` | NEW — server page |
| 10 | `src/app/dashboard/legal-finance/invoices/[id]/page.tsx` | NEW — server page |
| 11 | `src/app/api/internal/invoice-reminders/route.ts` | NEW — cron handler |
| 12 | `src/features/mandates/components/MandateDetailClient.tsx` | MODIFY — add Raise Invoice button |
| 13 | `src/app/dashboard/clients/[id]/page.tsx` | MODIFY — pass invoiceSummary |
| 14 | `src/features/clients/components/ClientDetailClient.tsx` | MODIFY — financial strip + Invoices tab |
| 15 | `vercel.json` | MODIFY — add cron entries |
| 16 | `package.json` | ADD `@react-pdf/renderer` dependency |

---

## 12. Permission Matrix

| Action | Admin | Consultant | Finance | Client | Candidate |
|--------|-------|------------|---------|--------|-----------|
| View invoice repository | ✅ | ✅ (own) | ✅ | ❌ | ❌ |
| Raise invoice | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit invoice (pre-share) | ✅ | ❌ | ✅ | ❌ | ❌ |
| Override commercial % | ✅ | ❌ | ✅ | ❌ | ❌ |
| Share invoice | ✅ | ❌ | ✅ | ❌ | ❌ |
| Cancel invoice | ✅ | ❌ | ✅ | ❌ | ❌ |
| Issue credit note | ✅ | ❌ | ✅ | ❌ | ❌ |
| Download invoice PDF | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 13. Testing Checklist

- [ ] Raise Invoice button only appears on mandates with stage=offer-accepted or closed
- [ ] All fields auto-populate correctly from mandate + candidate + signed contract
- [ ] Duplicate invoice detection fires before generation
- [ ] Commercial % always comes from signed contract (never manually entered by default)
- [ ] CGST/SGST vs IGST correctly determined by client state vs MK state
- [ ] Invoice number format: `MK-IN-2026-NNNNN` — no duplicates under concurrent requests
- [ ] Credit note number format: `CN-MK-IN-2026-NNNNN`
- [ ] Edit restriction: invoices with status Shared/Paid/Overdue show read-only with "Create Revised / Cancel / Credit Note" options only
- [ ] Cancellation: status=Cancelled, reason stored, invoice visible in audit history, excluded from active AR
- [ ] CANCELLED watermark appears on cancelled invoice PDF
- [ ] Client page shows correct financial aggregates
- [ ] Overdue auto-detection fires daily via cron
- [ ] Reminder notifications appear in Finance user's notification bell
- [ ] `npx tsc --noEmit` passes
