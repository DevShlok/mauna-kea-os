# Legal & Finance Module — Phase 2
## Contract Management — Full Implementation

**Status:** Planning  
**Depends on:** Phase 1 (schema, sidebar, libs)  
**Next phase:** Phase 3 — Invoice Management  

---

## 1. Objective

Deliver a complete, production-ready Contract Management module:

1. **Contract Repository** — searchable, filterable master table of all contracts
2. **4-Step Contract Creation Wizard** — client auto-fill → details → commercial terms → document generation
3. **Contract Detail View** — two-panel layout (metadata left, documents/timeline right)
4. **Contract Template System** — 2 built-in templates (Success Fee, Retained); Admin-configurable
5. **Approval Workflow** — Consultant → Business Head → Legal → Final
6. **Document Upload & Versioning** — signed PDF storage; no overwrites; full version history
7. **Renewal Management** — automated reminders via `consultantNotifications` table
8. **Client Page Integration** — new "Contracts" tab in `ClientDetailClient.tsx`
9. **AI Contract Analysis** — flag deviations, missing clauses, expiry risks

---

## 2. Existing System Context

### 2.1 How Client Pages Work

```ts
// src/app/dashboard/clients/[id]/page.tsx
// Server component fetches client + mandates + industries + associatedCandidates
// Passes to <ClientDetailClient> which renders a tab-based UI
// Currently tabs: active mandates | completed mandates | contacts | candidates
// We add: "Contracts" tab
```

### 2.2 How Mandates Are Fetched (Pagination Pattern)

```ts
// src/db/queries.ts — getMandatesPaginated()
// Uses cache() + drizzle query builder
// URL search params drive filters → server re-renders
// This exact pattern is reused for contracts
```

### 2.3 How File Upload Works (Existing Pattern from CV upload)

```ts
// src/actions/candidates.ts — importCandidateDocumentAction()
// Uses Supabase Storage client from @/utils/supabase/server
// File → ArrayBuffer → supabase.storage.from('bucket').upload(path, buffer)
// Returns public URL stored in DB
```

### 2.4 How Notifications Work

```ts
// src/db/schema.ts — consultantNotifications table
// Fields: userId, targetRole, message, link, isRead, createdAt
// Action: db.insert(consultantNotifications).values({...})
// Displayed in: Topbar notification bell
```

### 2.5 NeoCard Design System

```css
/* globals.css */
.neo-card        { box-shadow: 10px 10px 30px #d1d9e6; border-radius: 24px; }
.neo-card-sm     { box-shadow: 6px 6px 16px #d1d9e6; border-radius: 16px; }
.neo-btn-primary { background: linear-gradient(135deg, #133255, #1d4d82); border-radius: 50px; }
.neo-btn-gold    { background: linear-gradient(135deg, #D8B15B, #f0c96a); border-radius: 50px; }
.neo-table       { border-radius: 20px; overflow: hidden; }
.neo-input       { background: #f4f6fa; box-shadow: inset 3px 3px 8px #d1d9e6; }
```

All new components must use these classes. No ad-hoc Tailwind shadow/radius utilities.

### 2.6 `updateClientAction` — Current Behaviour

```ts
// src/actions/index.ts line 812
// Updates: name, accountId, vertical, owner, status, legalEntityName, contacts
// MUST be extended to also save the new Phase 1 billing/legal fields
// The existing Zod schema already extended in Phase 1 validations.ts
```

---

## 3. New Route Structure

```
src/app/dashboard/legal-finance/contracts/
├── page.tsx                    ← Contract Repository (server, paginated)
├── new/
│   └── page.tsx               ← Contract Creation Wizard shell
└── [id]/
    └── page.tsx               ← Contract Detail View (server)
```

---

## 4. Server Actions (`src/actions/legal-finance.ts`) — NEW FILE

This file contains all server actions for the Legal & Finance module.

```ts
"use server";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import {
  contracts, contractDocuments, clients, consultantNotifications,
  platformUsers, lfAuditLogs
} from "@/db/schema";
import { eq, desc, and, gte, lte, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUserName } from "@/lib/server-session";
import { writeLfAuditLog } from "@/lib/lf-audit";
import { generateContractNumber, generateInvoiceNumber } from "@/lib/lf-sequences";
import { newContractId, newInvoiceId } from "@/lib/ids";
import { createContractSchema } from "@/lib/validations";
```

### 4.1 `createContractAction`

```ts
export async function createContractAction(data: unknown) {
  const { platformUser } = await requireRole(["admin", "consultant", "finance"]);
  const d = createContractSchema.parse(data);
  const actorName = await getCurrentUserName();

  // 1. Fetch client and snapshot their legal data at this moment
  const [client] = await db.select().from(clients).where(eq(clients.id, d.clientId));
  if (!client) throw new Error("Client not found");

  const clientSnapshot = {
    name: client.name,
    legalEntityName: client.legalEntityName,
    gstNumber: (client as any).gstNumber,
    panNumber: (client as any).panNumber,
    billingAddress: (client as any).billingAddress,
    registeredAddress: (client as any).registeredAddress,
    city: (client as any).city,
    state: (client as any).state,
    country: (client as any).country,
    pinCode: (client as any).pinCode,
    placeOfSupply: (client as any).placeOfSupply,
    gstRate: (client as any).gstRate,
    currency: (client as any).currency || "INR",
    contacts: client.contacts,
  };

  // 2. Generate contract number atomically
  const contractNumber = await generateContractNumber();
  const contractId = newContractId();

  // 3. Insert contract
  await db.insert(contracts).values({
    id: contractId,
    contractNumber,
    clientId: d.clientId,
    clientSnapshot,
    consultant: d.consultant,
    businessHead: d.businessHead,
    practice: d.practice,
    contractStartDate: d.contractStartDate,
    contractEndDate: d.contractEndDate,
    renewalType: d.renewalType || "Manual",
    status: "Draft",
    commercialStructure: d.commercialStructure,
    successFeePct: d.successFeePct,
    minFee: d.minFee,
    maxFee: d.maxFee,
    retainerAmount: d.retainerAmount,
    replacementPeriod: d.replacementPeriod,
    guaranteePeriod: d.guaranteePeriod,
    paymentTerms: d.paymentTerms,
    currency: d.currency || "INR",
    billingMilestones: d.billingMilestones || [],
    latePaymentClause: d.latePaymentClause,
    travelExpenses: d.travelExpenses,
    oppExpenses: d.oppExpenses,
    exclusivity: d.exclusivity,
    nonPoachingMonths: d.nonPoachingMonths,
    confidentiality: d.confidentiality,
    notes: d.notes,
    createdBy: actorName,
    version: 1,
  });

  // 4. Audit log
  await writeLfAuditLog({
    entityType: "contract",
    entityId: contractId,
    action: "created",
    actorName,
    actorRole: platformUser?.role,
    newValue: { contractNumber, clientId: d.clientId, status: "Draft" },
  });

  revalidatePath("/dashboard/legal-finance/contracts");
  return { id: contractId, contractNumber };
}
```

### 4.2 `updateContractAction`

Only allowed while contract is `Draft` or `Shared` and not yet `Signed`. After `Signed`, changes require a renewal/amendment (new version).

```ts
export async function updateContractAction(contractId: string, data: unknown) {
  const { platformUser } = await requireRole(["admin", "consultant", "finance"]);
  const d = createContractSchema.partial().parse(data);
  const actorName = await getCurrentUserName();

  const [existing] = await db.select().from(contracts).where(eq(contracts.id, contractId));
  if (!existing) throw new Error("Contract not found");
  if (existing.status === "Signed") {
    throw new Error("Cannot edit a signed contract. Create a renewal or amendment instead.");
  }

  await writeLfAuditLog({
    entityType: "contract",
    entityId: contractId,
    action: "edited",
    actorName,
    actorRole: platformUser?.role,
    previousValue: { status: existing.status, successFeePct: existing.successFeePct },
    newValue: { successFeePct: d.successFeePct, status: d.status },
    changeReason: "User edit",
  });

  await db.update(contracts).set({
    ...d,
    updatedAt: new Date(),
  }).where(eq(contracts.id, contractId));

  revalidatePath("/dashboard/legal-finance/contracts");
}
```

### 4.3 `uploadSignedContractAction`

```ts
export async function uploadSignedContractAction(contractId: string, formData: FormData) {
  const { platformUser } = await requireRole(["admin", "consultant", "finance"]);
  const actorName = await getCurrentUserName();
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const { createClient } = await import("@/utils/supabase/server");
  const supabase = await createClient();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  const path = `contracts/${contractId}/signed_${Date.now()}_${file.name}`;

  const { data: uploadData, error } = await supabase.storage
    .from("legal-finance")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from("legal-finance")
    .getPublicUrl(path);

  // Store in contract_documents (append-only)
  await db.insert(contractDocuments).values({
    contractId,
    label: "Signed Copy",
    fileUrl: publicUrl,
    fileName: file.name,
    fileSizeBytes: file.size,
    uploadedBy: actorName,
  });

  // Update contract status and signed URL
  await db.update(contracts).set({
    status: "Signed",
    signedDocUrl: publicUrl,
    updatedAt: new Date(),
  }).where(eq(contracts.id, contractId));

  await writeLfAuditLog({
    entityType: "contract",
    entityId: contractId,
    action: "signed_uploaded",
    actorName,
    actorRole: platformUser?.role,
    newValue: { fileName: file.name, fileUrl: publicUrl },
  });

  revalidatePath("/dashboard/legal-finance/contracts");
  revalidatePath(`/dashboard/legal-finance/contracts/${contractId}`);
  return { publicUrl };
}
```

### 4.4 `approveContractAction`

```ts
export async function approveContractAction(contractId: string, newApprovalStatus: string) {
  const { platformUser } = await requireRole(["admin", "finance"]);
  const actorName = await getCurrentUserName();

  await db.update(contracts).set({
    approvalStatus: newApprovalStatus,
    approvedBy: newApprovalStatus === "Approved" ? actorName : undefined,
    approvedAt: newApprovalStatus === "Approved" ? new Date() : undefined,
    updatedAt: new Date(),
  }).where(eq(contracts.id, contractId));

  await writeLfAuditLog({
    entityType: "contract",
    entityId: contractId,
    action: newApprovalStatus === "Approved" ? "approved" : "rejected",
    actorName,
    actorRole: platformUser?.role,
  });

  revalidatePath("/dashboard/legal-finance/contracts");
}
```

### 4.5 `renewContractAction`

Creates a new contract row with `version + 1`, linking back via `parentContractId`.

```ts
export async function renewContractAction(parentId: string, data: unknown) {
  const { platformUser } = await requireRole(["admin", "consultant", "finance"]);
  const actorName = await getCurrentUserName();
  const d = createContractSchema.parse(data);

  const [parent] = await db.select().from(contracts).where(eq(contracts.id, parentId));
  if (!parent) throw new Error("Parent contract not found");

  const contractNumber = await generateContractNumber();
  const newId = newContractId();

  await db.insert(contracts).values({
    id: newId,
    contractNumber,
    clientId: parent.clientId,
    clientSnapshot: parent.clientSnapshot,
    consultant: d.consultant || parent.consultant,
    businessHead: d.businessHead || parent.businessHead,
    practice: d.practice || parent.practice,
    contractStartDate: d.contractStartDate,
    contractEndDate: d.contractEndDate,
    renewalType: d.renewalType || "Manual",
    status: "Draft",
    commercialStructure: d.commercialStructure || parent.commercialStructure,
    successFeePct: d.successFeePct ?? parent.successFeePct,
    minFee: d.minFee ?? parent.minFee,
    maxFee: d.maxFee ?? parent.maxFee,
    retainerAmount: d.retainerAmount ?? parent.retainerAmount,
    replacementPeriod: d.replacementPeriod ?? parent.replacementPeriod,
    guaranteePeriod: d.guaranteePeriod ?? parent.guaranteePeriod,
    paymentTerms: d.paymentTerms || parent.paymentTerms,
    currency: d.currency || parent.currency,
    billingMilestones: d.billingMilestones || parent.billingMilestones,
    exclusivity: d.exclusivity ?? parent.exclusivity,
    nonPoachingMonths: d.nonPoachingMonths ?? parent.nonPoachingMonths,
    confidentiality: d.confidentiality ?? parent.confidentiality,
    parentContractId: parentId,
    version: (parent.version || 1) + 1,
    createdBy: actorName,
    notes: d.notes,
  });

  await writeLfAuditLog({
    entityType: "contract",
    entityId: newId,
    action: "renewed",
    actorName,
    actorRole: platformUser?.role,
    previousValue: { parentContractId: parentId, parentVersion: parent.version },
    newValue: { contractNumber, newVersion: (parent.version || 1) + 1 },
  });

  revalidatePath("/dashboard/legal-finance/contracts");
  return { id: newId, contractNumber };
}
```

### 4.6 `getContractsPaginated` (Query — `src/db/queries.ts`)

```ts
export async function getContractsPaginated(params: {
  page: number;
  pageSize: number;
  clientId?: string;
  consultant?: string;
  status?: string;
  practice?: string;
  expiringInDays?: number; // filter contracts ending within N days
  search?: string;
}) {
  const { page, pageSize, clientId, consultant, status, practice, expiringInDays, search } = params;
  const offset = (page - 1) * pageSize;
  const filters = [eq(contracts.isDeleted, false)];
  if (clientId) filters.push(eq(contracts.clientId, clientId));
  if (consultant) filters.push(eq(contracts.consultant, consultant));
  if (status) filters.push(eq(contracts.status, status));
  if (practice) filters.push(eq(contracts.practice, practice));
  if (expiringInDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + expiringInDays);
    filters.push(lte(contracts.contractEndDate, cutoff.toISOString().split("T")[0]));
    filters.push(gte(contracts.contractEndDate, new Date().toISOString().split("T")[0]));
  }
  if (search) {
    filters.push(or(
      ilike(contracts.contractNumber, `%${search}%`),
      ilike(contracts.consultant, `%${search}%`),
    ) as any);
  }

  const [data, total] = await Promise.all([
    db.select().from(contracts)
      .leftJoin(clients, eq(contracts.clientId, clients.id))
      .where(and(...filters))
      .orderBy(desc(contracts.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`COUNT(*)` }).from(contracts).where(and(...filters)),
  ]);

  const totalCount = Number(total[0]?.count || 0);
  return {
    data,
    metadata: {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    },
  };
}
```

---

## 5. UI Components

### 5.1 Contract Repository Page (`ContractsClient.tsx`)

**Location:** `src/features/legal-finance/contracts/components/ContractsClient.tsx`

**Architecture:** Follows `MandatesClient.tsx` exactly — client component, URL-driven filters, paginated server fetch.

**Stat Cards (top strip):**
- Total Contracts | Active | Expiring (60 days) | Expired | Total Revenue (from active contracts)

**Filter Bar:**
- Search (contract number / client) | Client dropdown | Status dropdown | Practice dropdown | Consultant dropdown | "More Filters" (date range, commercial %)

**Table Columns:**
```
Contract No. | Client | Consultant | Practice | Start Date | End Date | Commercial % | Status | Renewal Due | Actions (⋮)
```

**Status badge colours (matching existing `.neo-card-xs` pill style):**
- Draft → grey
- Shared → blue
- Signed / Active → green
- Expiring Soon (≤60 days) → amber
- Expired → red
- Renewed → indigo
- Cancelled → dark red strikethrough

**Row click → split-view:** clicking a row opens a right-side detail panel (same pattern as invoice sample image). No separate route navigation for quick view.

**Actions menu (⋮):**
- View Details (navigate to `/contracts/[id]`)
- Upload Signed Contract
- Create Renewal
- Download PDF
- Share Contract (copy link)

### 5.2 Contract Creation Wizard (`ContractWizard.tsx`)

**4-step stepper:** horizontal progress bar, Back/Next buttons, step validation before advancing.

**Step 1 — Select Client**
- Single dropdown populated from `clients` table (`SELECT id, name FROM clients WHERE is_deleted=false ORDER BY name`)
- On selection, auto-populate a read-only grid: Legal Entity Name, GST, PAN, Billing Address, Contact Person, Email, Phone, Country/State/City
- "Edit Client Info" link opens client page in new tab
- Fields with missing data (no GST, no billing address) shown with amber warning badge

**Step 2 — Contract Details**
- Contract Number: auto-generated + displayed read-only
- Contract Start/End Date: date pickers
- Renewal Type: radio (Auto / Manual)
- Contract Owner (Consultant): dropdown of `platform_users` where role in (admin, consultant)
- Business Head: same dropdown
- Practice: text input with suggestions (Technology, Engineering, Life Sciences, Executive Search, etc.)
- Status: select (Draft is default)

**Step 3 — Commercial Structure**
- Template picker: two card buttons (Success Fee | Retained Search)
  - Clicking Success Fee pre-fills: successFeePct=22, replacementPeriod=90, paymentTerms="30 Days from Invoice"
  - Clicking Retained pre-fills: retainerAmount=200000, successFeePct=15, billingMilestones=[retainer, milestone, placement]
- All fields remain editable after template selection
- Fields: Success Fee %, Min Fee (₹), Max Fee (₹), Retainer (₹), Replacement Period (days), Guarantee Period (days), Payment Terms, GST applicable, TDS applicable, Currency, Billing Milestones, Late Payment Clause, Travel Expenses, OOP Expenses, Exclusivity toggle, Non-Poaching (months), Confidentiality toggle

**Step 4 — Generate & Review**
- Summary card showing all data
- Buttons: Download Draft PDF | Send for Approval | Save as Draft
- PDF generation: server-side using template merge (Phase 2 ships basic PDF; rich template in Phase 2.1)

### 5.3 Contract Detail View (`ContractDetailClient.tsx`)

**Layout:** Three-panel
- Left: Contract metadata + commercial summary
- Right top: Documents tab | Timeline tab | Renewal History tab
- Right bottom: Contract Notes (inline edit)

**Left panel fields:**
Contract No., Client (link to client page), Consultant, Practice, Start Date, End Date, Status, Renewal Due, Renewal Type, Contract Owner, Approved By, Approved On, Version, Notes

**Commercial Summary block:**
Commercial Structure, Success Fee %, Min Fee, Max Fee, Retainer (if any), Replacement Period, Payment Terms, GST, TDS, Currency, Place of Supply, Exclusivity, Poaching Clause

**Documents tab:**
Table: Label | File Name | Size | Uploaded By | Date | Download | ⋮ (view/delete)
Upload Document button → file picker → calls `uploadSignedContractAction`

**Timeline tab:**
Chronological list of `lf_audit_logs` entries for this contract

**Renewal History tab:**
List of all contracts sharing the same root `parentContractId` chain, sorted by version

**Action buttons (top right):**
- Edit (only if Draft/Shared)
- Download
- Share Contract
- Create Renewal

### 5.4 Client Page — Contracts Tab

**Location:** Modify `src/features/clients/components/ClientDetailClient.tsx`

Add "Contracts" to the tab bar. Tab content:

```tsx
// Contracts tab query (passed from server)
const clientContracts = await db.select().from(contracts)
  .where(and(eq(contracts.clientId, client.id), eq(contracts.isDeleted, false)))
  .orderBy(desc(contracts.createdAt));
```

Tab table columns: Contract No. | Start | End | Commercial % | Status | Renewal Due | Signed Copy | Actions

Below table: Financial summary strip:
- Total Invoices Raised | Total Revenue | Outstanding | Avg Payment Days (placeholder; live data from Phase 3)

---

## 6. Renewal Reminder System

**Trigger:** A background job (or cron via Vercel cron jobs / database-level pg_cron) runs nightly.

**Implementation for Phase 2:** Since Next.js server actions don't support cron, implement as a protected API route that can be called externally or via Vercel cron:

```
src/app/api/internal/contract-renewal-reminders/route.ts
```

Logic:
1. Query all non-deleted, non-cancelled, non-renewed contracts where `contractEndDate` falls within [today, today+60]
2. For each contract, check if a reminder was already sent today (check `lf_audit_logs` for action=`renewal_reminder` today)
3. If not sent, insert into `consultantNotifications`:
   - `userId`: lookup user by `contract.consultant` name (match `platformUsers.name`)
   - `message`: `"Contract ${contractNumber} for ${clientName} expires in ${daysLeft} days. Renewal required."`
   - `link`: `/dashboard/legal-finance/contracts/${contractId}`
4. Write audit log entry: action=`renewal_reminder`

**Reminder intervals:** 60, 45, 30, 15, 7 days before, and on expiry day.

```ts
// Reminder thresholds
const REMINDER_DAYS = [60, 45, 30, 15, 7, 0];
```

---

## 7. Client-Side Enrichment — Extend `updateClientAction`

```ts
// src/actions/index.ts — updateClientAction (extend existing)
export async function updateClientAction(id: string, data: unknown) {
  await requireRole(["admin", "consultant"]);
  const d = updateClientSchema.parse(data);  // schema now includes billing fields
  
  await db.update(clients).set({
    name: d.name,
    accountId: d.accountId,
    vertical: d.vertical,
    owner: d.owner,
    status: d.status || "Active",
    legalEntityName: d.legalEntityName || null,
    contacts: d.contacts || [],
    // NEW FIELDS:
    gstNumber: d.gstNumber || null,
    panNumber: d.panNumber || null,
    cinNumber: d.cinNumber || null,
    registeredAddress: d.registeredAddress || null,
    billingAddress: d.billingAddress || null,
    city: d.city || null,
    state: d.state || null,
    country: d.country || "India",
    pinCode: d.pinCode || null,
    financeContactName: d.financeContactName || null,
    financeEmail: d.financeEmail || null,
    billingEmail: d.billingEmail || null,
    billingPhone: d.billingPhone || null,
    placeOfSupply: d.placeOfSupply || null,
    currency: d.currency || "INR",
    defaultPaymentTerms: d.defaultPaymentTerms || null,
    requiresPo: d.requiresPo ?? false,
    vendorCode: d.vendorCode || null,
    clientCode: d.clientCode || null,
    tdsApplicable: d.tdsApplicable ?? true,
    gstApplicable: d.gstApplicable ?? true,
    gstRate: d.gstRate ?? 18,
  }).where(eq(clients.id, id));
  
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  return true;
}
```

Also extend `NewClientClient.tsx` and `ClientDetailClient.tsx` edit form to surface these fields in a new "Legal & Billing" accordion section, so users don't need to go to a separate page.

---

## 8. PDF Generation

**Approach:** Use `@react-pdf/renderer` (already a common Next.js pattern, no server dependency).

**Contract PDF structure:**
```
Header: MK logo + "CONTRACT AGREEMENT" title
Party block: Mauna Kea International Pvt. Ltd. ↔ {Client Legal Name}
Body sections:
  1. Engagement Details (role, geography, timeline)
  2. Commercial Terms (fee structure table)
  3. Replacement & Guarantee
  4. Payment Terms
  5. Standard Clauses (confidentiality, non-poaching, etc.)
  6. Signatures block: MK signatory | Client signatory
Footer: Page number, date, version
```

**Server Action for PDF generation:**
```ts
// src/actions/legal-finance.ts
export async function generateContractPdfAction(contractId: string): Promise<Uint8Array> {
  // Fetch contract + client data
  // Render PDF using @react-pdf/renderer
  // Return as Uint8Array (stream to browser)
}
```

---

## 9. Supabase Storage Setup

Create a storage bucket named `legal-finance` with:
- Folder structure: `contracts/{contractId}/`, `invoices/{invoiceId}/`
- Access: private (no public read) — URLs generated via signed URLs with 1-hour expiry for downloads
- Exception: signed contracts stored as public for embed preview

---

## 10. File Checklist

| # | File | Action |
|---|------|--------|
| 1 | `src/actions/legal-finance.ts` | NEW — all L&F server actions |
| 2 | `src/db/queries.ts` | Add `getContractsPaginated` |
| 3 | `src/actions/index.ts` | Extend `updateClientAction` with new fields |
| 4 | `src/features/legal-finance/` | NEW folder (contracts, invoices, payments, reports sub-features) |
| 5 | `src/features/legal-finance/contracts/components/ContractsClient.tsx` | NEW |
| 6 | `src/features/legal-finance/contracts/components/ContractWizard.tsx` | NEW |
| 7 | `src/features/legal-finance/contracts/components/ContractDetailClient.tsx` | NEW |
| 8 | `src/app/dashboard/legal-finance/contracts/page.tsx` | NEW — server page |
| 9 | `src/app/dashboard/legal-finance/contracts/new/page.tsx` | NEW — wizard page |
| 10 | `src/app/dashboard/legal-finance/contracts/[id]/page.tsx` | NEW — detail page |
| 11 | `src/app/api/internal/contract-renewal-reminders/route.ts` | NEW — cron handler |
| 12 | `src/features/clients/components/ClientDetailClient.tsx` | MODIFY — add Contracts tab |
| 13 | `src/features/clients/components/NewClientClient.tsx` | MODIFY — add Legal & Billing fields |
| 14 | `src/lib/lf-sequences.ts` | Already created in Phase 1 |
| 15 | `src/lib/lf-audit.ts` | Already created in Phase 1 |

---

## 11. Permission Matrix

| Action | Admin | Consultant | Finance | Client | Candidate |
|--------|-------|------------|---------|--------|-----------|
| View all contracts | ✅ | ✅ (own) | ✅ | ❌ | ❌ |
| Create contract | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit contract (pre-sign) | ✅ | ✅ (own) | ❌ | ❌ | ❌ |
| Upload signed copy | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve contract | ✅ | ❌ | ✅ | ❌ | ❌ |
| Delete (soft) | ✅ | ❌ | ❌ | ❌ | ❌ |
| View client billing info | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 12. Testing Checklist

- [ ] Contract wizard completes all 4 steps without error
- [ ] Auto-generated contract number format: `MK-CON-2026-NNNNN`, no duplicates under concurrent inserts
- [ ] Client data auto-populates on Step 1 selection
- [ ] Client snapshot is stored and immutable (editing client doesn't change old contracts)
- [ ] Signed contract upload stores file in Supabase Storage and updates status to "Signed"
- [ ] Version history visible: parent_contract_id chain works across renewals
- [ ] Renewal reminders create `consultantNotifications` entries at 60/45/30/15/7/0 days
- [ ] Audit log entry written for every action (create, edit, approve, upload, renew)
- [ ] Contract tab on client page shows linked contracts
- [ ] Finance user cannot access contract edit UI (enforced server-side by requireRole)
- [ ] Soft delete: cancelled contracts remain in DB, excluded from active view
- [ ] PDF generation produces valid, downloadable file
- [ ] `npx tsc --noEmit` passes after all changes
