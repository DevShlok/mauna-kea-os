# Legal & Finance Module — Phase 1
## Foundation: Database Schema · Client Enrichment · Sidebar · Permissions

**Status:** Planning  
**Depends on:** Existing schema.ts (0031 is the last migration), auth.ts, Sidebar.tsx, globals.css  
**Next phase:** Phase 2 — Contract Management  

---

## 1. Objective

Lay every structural foundation so that Phases 2–4 can build immediately on top without schema changes or rework:

1. Extend the `clients` table to become the single source of truth for all legal and finance data.
2. Create the four new tables: `contracts`, `contract_documents`, `invoices`, `invoice_payments`.
3. Create the immutable audit log table `lf_audit_logs`.
4. Add a `finance` role to the platform (permissions layer).
5. Wire the "Legal & Finance" nav group into `Sidebar.tsx`.
6. Add ID generators and Zod schemas for all new entities.
7. Write and run Migration `0032_legal_finance_foundation.sql`.

Nothing visible to the user is shipped in Phase 1 except the sidebar link. All routes will redirect to an "under development" placeholder until Phase 2 lands.

---

## 2. Existing System Context

### 2.1 Client Table — Current State

```ts
// src/db/schema.ts  lines 312–333
export const clients = pgTable('clients', {
  id: varchar('id', { length: 50 }).primaryKey(),         // CLI-<uuid>
  slug: varchar('slug', { length: 255 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  accountId: varchar('account_id', { length: 50 }),
  vertical: varchar('vertical', { length: 100 }),
  owner: varchar('owner', { length: 255 }),
  status: varchar('status', { length: 50 }).default('Active'),
  legalEntityName: varchar('legal_entity_name', { length: 255 }),
  contacts: json('contacts').$type<ContactEntry[]>().default([]),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: datetime('deleted_at'),
  deletedBy: varchar('deleted_by', { length: 255 }),
  createdAt: datetime('created_at').default(sql`now()`),
  metadata: json('metadata').$type<Record<string, any>>().default({}),
});
```

The `clients` table has minimal legal/billing fields. All the fields required for contract and invoice generation (GST, PAN, billing address, finance contact, currency defaults, etc.) are absent. They must be added **additively** — no existing column is renamed or dropped.

### 2.2 Platform Roles — Current State

```ts
// src/db/schema.ts line 273
role: varchar('role', { length: 50 }).default('candidate'),
// Values in use: 'admin' | 'consultant' | 'client' | 'candidate'
```

A `finance` role must be added to the vocabulary. Finance users should see all Legal & Finance routes but NOT the full candidate database or mandate pipeline.

### 2.3 Auth Guard — Current State

```ts
// src/lib/auth.ts  requireRole()
// Dashboard layout already calls requireRole(["admin", "consultant"])
// New L&F routes must call requireRole(["admin", "consultant", "finance"])
```

### 2.4 Sidebar — Current State

```ts
// src/components/shared/Sidebar.tsx  lines 52–116
// Navigation is a static array of category objects.
// Each has visibleTo: string[] controlling which roles see it.
// No "Legal & Finance" entry exists yet.
```

### 2.5 ID Factory — Current State

```ts
// src/lib/ids.ts
export const newUserId     = () => `U-${crypto.randomUUID()}`;
export const newCandId     = () => `CAND-${crypto.randomUUID()}`;
export const newFloatId    = () => `SUB-${crypto.randomUUID()}`;
export const newFollowUpId = () => `FU-${crypto.randomUUID()}`;
export const newClientId   = () => `CLI-${crypto.randomUUID()}`;
```

### 2.6 Validation Schemas — Current State

```ts
// src/lib/validations.ts  lines 161–173
export const createClientSchema = z.object({
  name: z.string().min(1),
  accountId: z.string().optional().nullable(),
  vertical: z.string().optional().nullable(),
  owner: z.string().optional().nullable(),
  status: z.string().optional().default("Active"),
  legalEntityName: z.string().optional().nullable(),
  contacts: z.array(z.any()).optional().default([]),
});
export const updateClientSchema = createClientSchema.omit({ id: true });
```

These schemas must be extended to accept the new billing/legal fields without breaking the existing client create/edit flows.

---

## 3. Database Changes

### 3.1 Extend `clients` Table (Additive Only)

All new columns are nullable so existing records remain valid.

```sql
-- New legal & billing columns on clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS gst_number           VARCHAR(20),
  ADD COLUMN IF NOT EXISTS pan_number            VARCHAR(15),
  ADD COLUMN IF NOT EXISTS cin_number            VARCHAR(25),
  ADD COLUMN IF NOT EXISTS registered_address    TEXT,
  ADD COLUMN IF NOT EXISTS billing_address       TEXT,
  ADD COLUMN IF NOT EXISTS city                  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state                 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS country               VARCHAR(100)   DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS pin_code              VARCHAR(10),
  -- Finance contacts
  ADD COLUMN IF NOT EXISTS finance_contact_name  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS finance_email         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS billing_email         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS billing_phone         VARCHAR(20),
  -- Tax & billing defaults
  ADD COLUMN IF NOT EXISTS place_of_supply       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS currency              VARCHAR(10)    DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS default_payment_terms VARCHAR(100),
  ADD COLUMN IF NOT EXISTS requires_po           BOOLEAN        DEFAULT false,
  ADD COLUMN IF NOT EXISTS vendor_code           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS client_code           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tds_applicable        BOOLEAN        DEFAULT true,
  ADD COLUMN IF NOT EXISTS gst_applicable        BOOLEAN        DEFAULT true,
  ADD COLUMN IF NOT EXISTS gst_rate              DOUBLE PRECISION DEFAULT 18.0;
```

### 3.2 New Table: `contracts`

```sql
CREATE TABLE IF NOT EXISTS contracts (
  id                    VARCHAR(50)  PRIMARY KEY,          -- CON-<uuid>
  contract_number       VARCHAR(50)  NOT NULL UNIQUE,      -- MK-CON-2026-00001
  client_id             VARCHAR(50)  REFERENCES clients(id) ON DELETE RESTRICT,
  -- Snapshot of client legal data at time of contract creation (immutable)
  client_snapshot       JSONB        NOT NULL DEFAULT '{}',
  consultant            VARCHAR(255),
  business_head         VARCHAR(255),
  practice              VARCHAR(100),
  contract_start_date   DATE         NOT NULL,
  contract_end_date     DATE         NOT NULL,
  renewal_type          VARCHAR(20)  NOT NULL DEFAULT 'Manual', -- 'Auto' | 'Manual'
  status                VARCHAR(30)  NOT NULL DEFAULT 'Draft',
    -- Draft | Shared | Signed | Expired | Renewed | Cancelled
  commercial_structure  VARCHAR(50),  -- 'SuccessFee' | 'Retained' | custom
  -- Commercial terms (structured)
  success_fee_pct       DOUBLE PRECISION,
  min_fee               DOUBLE PRECISION,
  max_fee               DOUBLE PRECISION,
  retainer_amount       DOUBLE PRECISION,
  replacement_period    INT,          -- days
  guarantee_period      INT,          -- days
  payment_terms         VARCHAR(100),
  currency              VARCHAR(10)  DEFAULT 'INR',
  billing_milestones    JSONB        DEFAULT '[]',
  late_payment_clause   TEXT,
  travel_expenses       TEXT,
  opp_expenses          TEXT,        -- out-of-pocket
  exclusivity           BOOLEAN      DEFAULT false,
  non_poaching_months   INT,         -- 0 = no clause
  confidentiality       BOOLEAN      DEFAULT true,
  -- Document
  draft_doc_url         VARCHAR(1000),
  signed_doc_url        VARCHAR(1000),
  -- Approval workflow
  approval_status       VARCHAR(30)  DEFAULT 'Pending',
    -- Pending | ApprovedByBH | ApprovedByLegal | Approved | Rejected
  approved_by           VARCHAR(255),
  approved_at           TIMESTAMP,
  -- Versioning
  version               INT          NOT NULL DEFAULT 1,
  parent_contract_id    VARCHAR(50)  REFERENCES contracts(id) ON DELETE SET NULL,
  -- Soft delete
  is_deleted            BOOLEAN      DEFAULT false,
  deleted_at            TIMESTAMP,
  deleted_by            VARCHAR(255),
  notes                 TEXT,
  created_by            VARCHAR(255),
  created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS con_client_id_idx    ON contracts (client_id);
CREATE INDEX IF NOT EXISTS con_status_idx        ON contracts (status);
CREATE INDEX IF NOT EXISTS con_end_date_idx      ON contracts (contract_end_date);
CREATE INDEX IF NOT EXISTS con_is_deleted_idx    ON contracts (is_deleted);
CREATE INDEX IF NOT EXISTS con_contract_num_idx  ON contracts (contract_number);
```

### 3.3 New Table: `contract_documents`

Stores every version of every file uploaded against a contract. Never overwrite; append-only.

```sql
CREATE TABLE IF NOT EXISTS contract_documents (
  id              SERIAL        PRIMARY KEY,
  contract_id     VARCHAR(50)   NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  label           VARCHAR(255)  NOT NULL,   -- 'Draft', 'Signed Copy', 'Annexure', 'Amendment'
  file_url        VARCHAR(1000) NOT NULL,
  file_name       VARCHAR(255)  NOT NULL,
  file_size_bytes INT,
  uploaded_by     VARCHAR(255),
  uploaded_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cd_contract_id_idx ON contract_documents (contract_id);
```

### 3.4 New Table: `invoices`

```sql
CREATE TABLE IF NOT EXISTS invoices (
  id                  VARCHAR(50)   PRIMARY KEY,          -- INV-<uuid>
  invoice_number      VARCHAR(50)   NOT NULL UNIQUE,      -- MK-IN-2026-00001
  -- Links
  client_id           VARCHAR(50)   REFERENCES clients(id) ON DELETE RESTRICT,
  contract_id         VARCHAR(50)   REFERENCES contracts(id) ON DELETE RESTRICT,
  mandate_id          INT           REFERENCES mandates(id) ON DELETE RESTRICT,
  cand_id             VARCHAR(50)   REFERENCES candidates(id) ON DELETE RESTRICT,
  -- Snapshots (immutable after share)
  client_snapshot     JSONB         NOT NULL DEFAULT '{}',
  commercial_snapshot JSONB         NOT NULL DEFAULT '{}',
  -- Invoice details
  invoice_date        DATE          NOT NULL,
  due_date            DATE          NOT NULL,
  joining_date        DATE,
  annual_ctc          DOUBLE PRECISION,
  commercial_pct      DOUBLE PRECISION,
  fee_before_tax      DOUBLE PRECISION,
  gst_rate            DOUBLE PRECISION DEFAULT 18.0,
  gst_amount          DOUBLE PRECISION,
  cgst_amount         DOUBLE PRECISION,
  sgst_amount         DOUBLE PRECISION,
  igst_amount         DOUBLE PRECISION,
  tds_rate            DOUBLE PRECISION DEFAULT 0,
  tds_amount          DOUBLE PRECISION,
  total_amount        DOUBLE PRECISION,
  currency            VARCHAR(10)   DEFAULT 'INR',
  place_of_supply     VARCHAR(100),
  hsn_sac_code        VARCHAR(20)   DEFAULT '998313',
  po_number           VARCHAR(100),
  -- Status
  status              VARCHAR(30)   NOT NULL DEFAULT 'Draft',
    -- Draft | Generated | Shared | Paid | Partially Paid | Overdue | Cancelled | Credit Note Issued
  -- Payment tracking (aggregate)
  amount_paid         DOUBLE PRECISION DEFAULT 0,
  amount_outstanding  DOUBLE PRECISION,
  -- Version control
  version             INT           NOT NULL DEFAULT 1,
  parent_invoice_id   VARCHAR(50)   REFERENCES invoices(id) ON DELETE SET NULL,
  cancel_reason       TEXT,
  cancel_by           VARCHAR(255),
  cancelled_at        TIMESTAMP,
  -- Consultant
  consultant          VARCHAR(255),
  created_by          VARCHAR(255),
  -- Soft delete (never hard delete)
  is_deleted          BOOLEAN       DEFAULT false,
  deleted_at          TIMESTAMP,
  deleted_by          VARCHAR(255),
  notes               TEXT,
  created_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inv_client_id_idx    ON invoices (client_id);
CREATE INDEX IF NOT EXISTS inv_contract_id_idx  ON invoices (contract_id);
CREATE INDEX IF NOT EXISTS inv_mandate_id_idx   ON invoices (mandate_id);
CREATE INDEX IF NOT EXISTS inv_status_idx        ON invoices (status);
CREATE INDEX IF NOT EXISTS inv_due_date_idx      ON invoices (due_date);
CREATE INDEX IF NOT EXISTS inv_is_deleted_idx    ON invoices (is_deleted);
CREATE INDEX IF NOT EXISTS inv_invoice_num_idx   ON invoices (invoice_number);
```

### 3.5 New Table: `invoice_payments`

Each row is one payment event. Supports partial payments, payment reversals.

```sql
CREATE TABLE IF NOT EXISTS invoice_payments (
  id                SERIAL        PRIMARY KEY,
  invoice_id        VARCHAR(50)   NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_date      DATE          NOT NULL,
  amount            DOUBLE PRECISION NOT NULL,
  reference_number  VARCHAR(100),
  utr_number        VARCHAR(100),
  mode              VARCHAR(50),    -- 'NEFT' | 'RTGS' | 'IMPS' | 'Cheque' | 'Cash' | 'Other'
  notes             TEXT,
  is_reversed       BOOLEAN       DEFAULT false,
  reversed_at       TIMESTAMP,
  reversed_by       VARCHAR(255),
  reversal_reason   TEXT,
  recorded_by       VARCHAR(255),
  created_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ip_invoice_id_idx ON invoice_payments (invoice_id);
```

### 3.6 New Table: `lf_audit_logs` (Immutable)

No UPDATE or DELETE is ever issued against this table from application code. Only INSERT.

```sql
CREATE TABLE IF NOT EXISTS lf_audit_logs (
  id              BIGSERIAL     PRIMARY KEY,
  entity_type     VARCHAR(30)   NOT NULL,  -- 'contract' | 'invoice' | 'payment' | 'client'
  entity_id       VARCHAR(100)  NOT NULL,
  action          VARCHAR(50)   NOT NULL,
    -- contract: created|edited|downloaded|shared|approved|rejected|signed_uploaded|renewed|expired|deleted
    -- invoice:  created|edited|shared|downloaded|cancelled|cn_issued|payment_recorded|payment_reversed
    -- client:   gst_updated|billing_changed|commercials_modified
  actor_name      VARCHAR(255)  NOT NULL,
  actor_role      VARCHAR(50),
  timestamp       TIMESTAMP     NOT NULL DEFAULT NOW(),
  ip_address      VARCHAR(45),
  previous_value  JSONB,
  new_value       JSONB,
  change_reason   TEXT,
  metadata        JSONB         DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS lfa_entity_idx  ON lf_audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS lfa_action_idx  ON lf_audit_logs (action);
CREATE INDEX IF NOT EXISTS lfa_actor_idx   ON lf_audit_logs (actor_name);
CREATE INDEX IF NOT EXISTS lfa_ts_idx      ON lf_audit_logs (timestamp DESC);
```

### 3.7 Sequence Table for Auto-Numbers

```sql
CREATE TABLE IF NOT EXISTS lf_sequences (
  key        VARCHAR(50)  PRIMARY KEY,  -- 'contract_2026' | 'invoice_2026'
  last_val   INT          NOT NULL DEFAULT 0
);
```

---

## 4. Drizzle ORM Schema (`src/db/schema.ts`)

Add the following exports below the existing tables. Follow the same import style already in the file.

```ts
// ─── CONTRACTS ───────────────────────────────────────────────────────────────
export const contracts = pgTable('contracts', {
  id: varchar('id', { length: 50 }).primaryKey(),
  contractNumber: varchar('contract_number', { length: 50 }).notNull().unique(),
  clientId: varchar('client_id', { length: 50 }).references(() => clients.id, { onDelete: 'restrict' }),
  clientSnapshot: json('client_snapshot').$type<Record<string, any>>().default({}),
  consultant: varchar('consultant', { length: 255 }),
  businessHead: varchar('business_head', { length: 255 }),
  practice: varchar('practice', { length: 100 }),
  contractStartDate: date('contract_start_date').notNull(),
  contractEndDate: date('contract_end_date').notNull(),
  renewalType: varchar('renewal_type', { length: 20 }).default('Manual'),
  status: varchar('status', { length: 30 }).default('Draft'),
  commercialStructure: varchar('commercial_structure', { length: 50 }),
  successFeePct: float('success_fee_pct'),
  minFee: float('min_fee'),
  maxFee: float('max_fee'),
  retainerAmount: float('retainer_amount'),
  replacementPeriod: int('replacement_period'),
  guaranteePeriod: int('guarantee_period'),
  paymentTerms: varchar('payment_terms', { length: 100 }),
  currency: varchar('currency', { length: 10 }).default('INR'),
  billingMilestones: json('billing_milestones').$type<any[]>().default([]),
  latePaymentClause: text('late_payment_clause'),
  travelExpenses: text('travel_expenses'),
  oppExpenses: text('opp_expenses'),
  exclusivity: boolean('exclusivity').default(false),
  nonPoachingMonths: int('non_poaching_months').default(0),
  confidentiality: boolean('confidentiality').default(true),
  draftDocUrl: varchar('draft_doc_url', { length: 1000 }),
  signedDocUrl: varchar('signed_doc_url', { length: 1000 }),
  approvalStatus: varchar('approval_status', { length: 30 }).default('Pending'),
  approvedBy: varchar('approved_by', { length: 255 }),
  approvedAt: datetime('approved_at'),
  version: int('version').default(1).notNull(),
  parentContractId: varchar('parent_contract_id', { length: 50 }),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: datetime('deleted_at'),
  deletedBy: varchar('deleted_by', { length: 255 }),
  notes: text('notes'),
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: datetime('created_at').default(sql`now()`),
  updatedAt: datetime('updated_at').default(sql`now()`),
}, (table) => ({
  clientIdIdx: index('con_client_id_idx').on(table.clientId),
  statusIdx: index('con_status_idx').on(table.status),
  endDateIdx: index('con_end_date_idx').on(table.contractEndDate),
  isDeletedIdx: index('con_is_deleted_idx').on(table.isDeleted),
}));

// ─── CONTRACT DOCUMENTS ───────────────────────────────────────────────────────
export const contractDocuments = pgTable('contract_documents', {
  id: serial('id').primaryKey(),
  contractId: varchar('contract_id', { length: 50 }).notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 255 }).notNull(),
  fileUrl: varchar('file_url', { length: 1000 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSizeBytes: int('file_size_bytes'),
  uploadedBy: varchar('uploaded_by', { length: 255 }),
  uploadedAt: datetime('uploaded_at').default(sql`now()`),
}, (table) => ({
  contractIdIdx: index('cd_contract_id_idx').on(table.contractId),
}));

// ─── INVOICES ─────────────────────────────────────────────────────────────────
export const invoices = pgTable('invoices', {
  id: varchar('id', { length: 50 }).primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  clientId: varchar('client_id', { length: 50 }).references(() => clients.id, { onDelete: 'restrict' }),
  contractId: varchar('contract_id', { length: 50 }).references(() => contracts.id, { onDelete: 'restrict' }),
  mandateId: int('mandate_id').references(() => mandates.id, { onDelete: 'restrict' }),
  candId: varchar('cand_id', { length: 50 }).references(() => candidates.id, { onDelete: 'restrict' }),
  clientSnapshot: json('client_snapshot').$type<Record<string, any>>().default({}),
  commercialSnapshot: json('commercial_snapshot').$type<Record<string, any>>().default({}),
  invoiceDate: date('invoice_date').notNull(),
  dueDate: date('due_date').notNull(),
  joiningDate: date('joining_date'),
  annualCtc: float('annual_ctc'),
  commercialPct: float('commercial_pct'),
  feeBeforeTax: float('fee_before_tax'),
  gstRate: float('gst_rate').default(18),
  gstAmount: float('gst_amount'),
  cgstAmount: float('cgst_amount'),
  sgstAmount: float('sgst_amount'),
  igstAmount: float('igst_amount'),
  tdsRate: float('tds_rate').default(0),
  tdsAmount: float('tds_amount'),
  totalAmount: float('total_amount'),
  currency: varchar('currency', { length: 10 }).default('INR'),
  placeOfSupply: varchar('place_of_supply', { length: 100 }),
  hsnSacCode: varchar('hsn_sac_code', { length: 20 }).default('998313'),
  poNumber: varchar('po_number', { length: 100 }),
  status: varchar('status', { length: 30 }).default('Draft'),
  amountPaid: float('amount_paid').default(0),
  amountOutstanding: float('amount_outstanding'),
  version: int('version').default(1).notNull(),
  parentInvoiceId: varchar('parent_invoice_id', { length: 50 }),
  cancelReason: text('cancel_reason'),
  cancelBy: varchar('cancel_by', { length: 255 }),
  cancelledAt: datetime('cancelled_at'),
  consultant: varchar('consultant', { length: 255 }),
  createdBy: varchar('created_by', { length: 255 }),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: datetime('deleted_at'),
  deletedBy: varchar('deleted_by', { length: 255 }),
  notes: text('notes'),
  createdAt: datetime('created_at').default(sql`now()`),
  updatedAt: datetime('updated_at').default(sql`now()`),
}, (table) => ({
  clientIdIdx: index('inv_client_id_idx').on(table.clientId),
  contractIdIdx: index('inv_contract_id_idx').on(table.contractId),
  mandateIdIdx: index('inv_mandate_id_idx').on(table.mandateId),
  statusIdx: index('inv_status_idx').on(table.status),
  dueDateIdx: index('inv_due_date_idx').on(table.dueDate),
  isDeletedIdx: index('inv_is_deleted_idx').on(table.isDeleted),
}));

// ─── INVOICE PAYMENTS ─────────────────────────────────────────────────────────
export const invoicePayments = pgTable('invoice_payments', {
  id: serial('id').primaryKey(),
  invoiceId: varchar('invoice_id', { length: 50 }).notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  paymentDate: date('payment_date').notNull(),
  amount: float('amount').notNull(),
  referenceNumber: varchar('reference_number', { length: 100 }),
  utrNumber: varchar('utr_number', { length: 100 }),
  mode: varchar('mode', { length: 50 }),
  notes: text('notes'),
  isReversed: boolean('is_reversed').default(false),
  reversedAt: datetime('reversed_at'),
  reversedBy: varchar('reversed_by', { length: 255 }),
  reversalReason: text('reversal_reason'),
  recordedBy: varchar('recorded_by', { length: 255 }),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  invoiceIdIdx: index('ip_invoice_id_idx').on(table.invoiceId),
}));

// ─── LEGAL & FINANCE AUDIT LOG (IMMUTABLE) ────────────────────────────────────
export const lfAuditLogs = pgTable('lf_audit_logs', {
  id: serial('id').primaryKey(),
  entityType: varchar('entity_type', { length: 30 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  actorName: varchar('actor_name', { length: 255 }).notNull(),
  actorRole: varchar('actor_role', { length: 50 }),
  timestamp: datetime('timestamp').default(sql`now()`).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  previousValue: json('previous_value').$type<Record<string, any>>(),
  newValue: json('new_value').$type<Record<string, any>>(),
  changeReason: text('change_reason'),
  metadata: json('metadata').$type<Record<string, any>>().default({}),
}, (table) => ({
  entityIdx: index('lfa_entity_idx').on(table.entityType, table.entityId),
  actionIdx: index('lfa_action_idx').on(table.action),
  tsIdx: index('lfa_ts_idx').on(table.timestamp),
}));

// ─── SEQUENCE COUNTER ─────────────────────────────────────────────────────────
export const lfSequences = pgTable('lf_sequences', {
  key: varchar('key', { length: 50 }).primaryKey(),
  lastVal: int('last_val').notNull().default(0),
});

// ─── INFERRED TYPES ───────────────────────────────────────────────────────────
export type Contract = typeof contracts.$inferSelect;
export type ContractDocument = typeof contractDocuments.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoicePayment = typeof invoicePayments.$inferSelect;
export type LfAuditLog = typeof lfAuditLogs.$inferSelect;
```

**Drizzle relations to add:**

```ts
export const contractsRelations = relations(contracts, ({ one, many }) => ({
  client: one(clients, { fields: [contracts.clientId], references: [clients.id] }),
  documents: many(contractDocuments),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, { fields: [invoices.clientId], references: [clients.id] }),
  contract: one(contracts, { fields: [invoices.contractId], references: [contracts.id] }),
  payments: many(invoicePayments),
}));
```

---

## 5. ID Generators (`src/lib/ids.ts`)

Add:

```ts
export const newContractId = () => `CON-${crypto.randomUUID()}`;
export const newInvoiceId  = () => `INV-${crypto.randomUUID()}`;
```

Contract numbers and invoice numbers are generated via database sequence, not UUID. See Section 6.

---

## 6. Auto-Number Generation (`src/lib/lf-sequences.ts`) — NEW FILE

```ts
// src/lib/lf-sequences.ts
"use server";
import { db } from "@/db";
import { lfSequences } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Atomically increments the sequence counter and returns the next number.
 * Key format: 'contract_YYYY' | 'invoice_YYYY'
 * Returns a zero-padded 5-digit string: "00001"
 */
export async function nextLfSequence(type: "contract" | "invoice"): Promise<string> {
  const year = new Date().getFullYear();
  const key = `${type}_${year}`;
  
  // Upsert + increment in a single atomic statement
  await db.insert(lfSequences)
    .values({ key, lastVal: 1 })
    .onConflictDoUpdate({
      target: lfSequences.key,
      set: { lastVal: sql`${lfSequences.lastVal} + 1` },
    });

  const [row] = await db
    .select({ lastVal: lfSequences.lastVal })
    .from(lfSequences)
    .where(eq(lfSequences.key, key));

  return String(row.lastVal).padStart(5, "0");
}

/**
 * Generates a full contract number: MK-CON-2026-00001
 */
export async function generateContractNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextLfSequence("contract");
  return `MK-CON-${year}-${seq}`;
}

/**
 * Generates a full invoice number: MK-IN-2026-00001
 */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextLfSequence("invoice");
  return `MK-IN-${year}-${seq}`;
}
```

---

## 7. Audit Log Helper (`src/lib/lf-audit.ts`) — NEW FILE

```ts
// src/lib/lf-audit.ts
"use server";
import { db } from "@/db";
import { lfAuditLogs } from "@/db/schema";

export interface AuditPayload {
  entityType: "contract" | "invoice" | "payment" | "client";
  entityId: string;
  action: string;
  actorName: string;
  actorRole?: string;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  changeReason?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

/**
 * Appends an immutable audit log entry.
 * Never throws — failures are logged to console only so they
 * don't break the parent transaction.
 */
export async function writeLfAuditLog(payload: AuditPayload): Promise<void> {
  try {
    await db.insert(lfAuditLogs).values({
      entityType: payload.entityType,
      entityId: payload.entityId,
      action: payload.action,
      actorName: payload.actorName,
      actorRole: payload.actorRole,
      previousValue: payload.previousValue,
      newValue: payload.newValue,
      changeReason: payload.changeReason,
      ipAddress: payload.ipAddress,
      metadata: payload.metadata || {},
    });
  } catch (e) {
    console.error("[LF Audit Log] Failed to write:", e);
  }
}
```

---

## 8. Validation Schemas (`src/lib/validations.ts`)

Extend the existing `createClientSchema` with the new legal/billing fields. The omit-based `updateClientSchema` will inherit automatically.

```ts
export const createClientSchema = z.object({
  // ... keep all existing fields ...
  // NEW legal & billing fields
  gstNumber:          z.string().optional().nullable(),
  panNumber:          z.string().optional().nullable(),
  cinNumber:          z.string().optional().nullable(),
  registeredAddress:  z.string().optional().nullable(),
  billingAddress:     z.string().optional().nullable(),
  city:               z.string().optional().nullable(),
  state:              z.string().optional().nullable(),
  country:            z.string().optional().default("India"),
  pinCode:            z.string().optional().nullable(),
  financeContactName: z.string().optional().nullable(),
  financeEmail:       z.string().email().optional().nullable().or(z.literal("")),
  billingEmail:       z.string().email().optional().nullable().or(z.literal("")),
  billingPhone:       z.string().optional().nullable(),
  placeOfSupply:      z.string().optional().nullable(),
  currency:           z.string().optional().default("INR"),
  defaultPaymentTerms:z.string().optional().nullable(),
  requiresPo:         z.boolean().optional().default(false),
  vendorCode:         z.string().optional().nullable(),
  clientCode:         z.string().optional().nullable(),
  tdsApplicable:      z.boolean().optional().default(true),
  gstApplicable:      z.boolean().optional().default(true),
  gstRate:            z.number().optional().default(18),
});
```

Add contract and invoice schemas:

```ts
export const createContractSchema = z.object({
  clientId:            z.string().min(1),
  contractStartDate:   z.string().min(1),
  contractEndDate:     z.string().min(1),
  renewalType:         z.enum(["Auto", "Manual"]).default("Manual"),
  consultant:          z.string().optional().nullable(),
  businessHead:        z.string().optional().nullable(),
  practice:            z.string().optional().nullable(),
  status:              z.enum(["Draft","Shared","Signed","Expired","Renewed","Cancelled"]).default("Draft"),
  commercialStructure: z.enum(["SuccessFee","Retained","Custom"]).optional().nullable(),
  successFeePct:       z.number().optional().nullable(),
  minFee:              z.number().optional().nullable(),
  maxFee:              z.number().optional().nullable(),
  retainerAmount:      z.number().optional().nullable(),
  replacementPeriod:   z.number().optional().nullable(),
  guaranteePeriod:     z.number().optional().nullable(),
  paymentTerms:        z.string().optional().nullable(),
  currency:            z.string().optional().default("INR"),
  billingMilestones:   z.array(z.any()).optional().default([]),
  latePaymentClause:   z.string().optional().nullable(),
  travelExpenses:      z.string().optional().nullable(),
  oppExpenses:         z.string().optional().nullable(),
  exclusivity:         z.boolean().optional().default(false),
  nonPoachingMonths:   z.number().optional().default(0),
  confidentiality:     z.boolean().optional().default(true),
  notes:               z.string().optional().nullable(),
});
```

---

## 9. Sidebar Navigation (`src/components/shared/Sidebar.tsx`)

Insert after the "Engagement Lists" category and before "Productivity Tools":

```ts
{
  title: "Legal & Finance",
  icon: Scale,           // import Scale from "lucide-react"
  visibleTo: ["admin", "consultant", "finance"],
  children: [
    { label: "Contracts",       href: "/dashboard/legal-finance/contracts",     visibleTo: ["admin", "consultant", "finance"] },
    { label: "Invoices",        href: "/dashboard/legal-finance/invoices",       visibleTo: ["admin", "finance"] },
    { label: "Payments",        href: "/dashboard/legal-finance/payments",       visibleTo: ["admin", "finance"] },
    { label: "Reports",         href: "/dashboard/legal-finance/reports",        visibleTo: ["admin", "finance"] },
  ]
},
```

Also add `Scale` to the lucide-react import at line 5.

---

## 10. Auth Guard Update

The `requireRole` function in `src/lib/auth.ts` already accepts any role string. Finance users will remain within the dashboard shell — the only change is that dashboard route pages add `"finance"` to their allowed roles list:

```ts
// Phase 1: dashboard/layout.tsx stays as-is (admin|consultant)
// Legal & Finance route pages use:
await requireRole(["admin", "consultant", "finance"]);
// Finance role will redirect non-finance users to /dashboard (existing redirect logic)
```

No change needed to `auth.ts` itself in Phase 1.

---

## 11. Placeholder Routes (Phase 1 Shell)

Create these directories and `page.tsx` stubs so the sidebar links don't 404:

```
src/app/dashboard/legal-finance/
├── layout.tsx          ← requireRole(["admin","consultant","finance"])
├── page.tsx            ← redirect to /legal-finance/contracts
├── contracts/
│   └── page.tsx        ← "Coming soon" placeholder
├── invoices/
│   └── page.tsx        ← "Coming soon" placeholder
├── payments/
│   └── page.tsx        ← "Coming soon" placeholder
└── reports/
    └── page.tsx        ← "Coming soon" placeholder
```

Each placeholder renders the existing `<UnderDevelopment />` component already at `src/app/under-development/`.

---

## 12. Migration File

**File:** `src/db/migrations/0032_legal_finance_foundation.sql`

Run with: `npx drizzle-kit push` or by executing against the Supabase database directly.

The migration contains (in order):
1. `ALTER TABLE clients ADD COLUMN IF NOT EXISTS ...` (all new billing columns)
2. `CREATE TABLE IF NOT EXISTS contracts (...)`
3. `CREATE TABLE IF NOT EXISTS contract_documents (...)`
4. `CREATE TABLE IF NOT EXISTS invoices (...)`
5. `CREATE TABLE IF NOT EXISTS invoice_payments (...)`
6. `CREATE TABLE IF NOT EXISTS lf_audit_logs (...)`
7. `CREATE TABLE IF NOT EXISTS lf_sequences (...)`
8. All indexes

---

## 13. File Checklist

| # | File | Action |
|---|------|--------|
| 1 | `src/db/schema.ts` | Add contracts, contractDocuments, invoices, invoicePayments, lfAuditLogs, lfSequences tables and relations |
| 2 | `src/db/migrations/0032_legal_finance_foundation.sql` | NEW — full SQL migration |
| 3 | `src/lib/ids.ts` | Add `newContractId`, `newInvoiceId` |
| 4 | `src/lib/lf-sequences.ts` | NEW — auto-number generator |
| 5 | `src/lib/lf-audit.ts` | NEW — audit log helper |
| 6 | `src/lib/validations.ts` | Extend `createClientSchema`, add `createContractSchema` |
| 7 | `src/components/shared/Sidebar.tsx` | Add Legal & Finance nav category |
| 8 | `src/app/dashboard/legal-finance/layout.tsx` | NEW — role guard + shell |
| 9 | `src/app/dashboard/legal-finance/page.tsx` | NEW — redirect |
| 10 | `src/app/dashboard/legal-finance/contracts/page.tsx` | NEW — placeholder |
| 11 | `src/app/dashboard/legal-finance/invoices/page.tsx` | NEW — placeholder |
| 12 | `src/app/dashboard/legal-finance/payments/page.tsx` | NEW — placeholder |
| 13 | `src/app/dashboard/legal-finance/reports/page.tsx` | NEW — placeholder |

---

## 14. Testing Checklist

- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] Migration runs cleanly on a fresh DB and on production without data loss
- [ ] All existing client create/edit flows continue to work (new fields are nullable)
- [ ] Sidebar shows "Legal & Finance" for admin and consultant roles
- [ ] Sidebar does NOT show "Legal & Finance" for candidate/client roles
- [ ] Placeholder routes render without error
- [ ] `lf_audit_logs` table has no UPDATE/DELETE grants

---

## 15. What Phase 2 Builds On Top Of This

Phase 2 (Contract Management) will:
- Build the full Contract Repository page using the `contracts` table
- Build the 4-step Contract Creation Wizard
- Add file upload to Supabase Storage for contract documents (stored in `contract_documents`)
- Wire the Approval Workflow columns (`approvalStatus`, `approvedBy`, `approvedAt`)
- Extend `ClientDetailClient.tsx` with a "Contracts" tab
- Use `generateContractNumber()` and `writeLfAuditLog()` from Phase 1 libs
