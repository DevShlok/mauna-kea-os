-- ─── Migration 0032: Legal & Finance Foundation ───────────────────────────────
--
-- This migration introduces the complete foundation for the Legal & Finance module:
-- 1. Extend clients table with legal/billing columns (additive, all nullable)
-- 2. Create contracts table (contract registry)
-- 3. Create contract_documents table (append-only file history)
-- 4. Create invoices table
-- 5. Create invoice_payments table (payment ledger)
-- 6. Create lf_audit_logs table (immutable audit trail)
-- 7. Create lf_sequences table (auto-number counters)
--
-- All statements use IF NOT EXISTS / IF COLUMN DOES NOT EXIST guards so
-- the migration is safe to re-run.
-- ────────────────────────────────────────────────────────────────────────────

-- ── 1. Extend clients table ──────────────────────────────────────────────────
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS gst_number            VARCHAR(25),
  ADD COLUMN IF NOT EXISTS pan_number            VARCHAR(15),
  ADD COLUMN IF NOT EXISTS cin_number            VARCHAR(25),
  ADD COLUMN IF NOT EXISTS registered_address    TEXT,
  ADD COLUMN IF NOT EXISTS billing_address       TEXT,
  ADD COLUMN IF NOT EXISTS city                  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state                 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS country               VARCHAR(100) DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS pin_code              VARCHAR(10),
  ADD COLUMN IF NOT EXISTS finance_contact_name  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS finance_email         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS billing_email         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS billing_phone         VARCHAR(20),
  ADD COLUMN IF NOT EXISTS place_of_supply       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS currency              VARCHAR(10)  DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS default_payment_terms VARCHAR(100),
  ADD COLUMN IF NOT EXISTS requires_po           BOOLEAN      DEFAULT false,
  ADD COLUMN IF NOT EXISTS vendor_code           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS client_code           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tds_applicable        BOOLEAN      DEFAULT true,
  ADD COLUMN IF NOT EXISTS gst_applicable        BOOLEAN      DEFAULT true,
  ADD COLUMN IF NOT EXISTS gst_rate              DOUBLE PRECISION DEFAULT 18.0;

-- ── 2. Sequence counter table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lf_sequences (
  key        VARCHAR(50) PRIMARY KEY,
  last_val   INTEGER     NOT NULL DEFAULT 0
);

-- ── 3. Contracts table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id                    VARCHAR(50)       PRIMARY KEY,
  contract_number       VARCHAR(60)       NOT NULL UNIQUE,
  client_id             VARCHAR(50)       REFERENCES clients(id) ON DELETE RESTRICT,
  client_snapshot       JSONB             NOT NULL DEFAULT '{}',
  consultant            VARCHAR(255),
  business_head         VARCHAR(255),
  practice              VARCHAR(100),
  contract_start_date   DATE              NOT NULL,
  contract_end_date     DATE              NOT NULL,
  renewal_type          VARCHAR(20)       NOT NULL DEFAULT 'Manual',
  status                VARCHAR(30)       NOT NULL DEFAULT 'Draft',
  commercial_structure  VARCHAR(50),
  success_fee_pct       DOUBLE PRECISION,
  min_fee               DOUBLE PRECISION,
  max_fee               DOUBLE PRECISION,
  retainer_amount       DOUBLE PRECISION,
  replacement_period    INTEGER,
  guarantee_period      INTEGER,
  payment_terms         VARCHAR(100),
  currency              VARCHAR(10)       DEFAULT 'INR',
  billing_milestones    JSONB             DEFAULT '[]',
  late_payment_clause   TEXT,
  travel_expenses       TEXT,
  opp_expenses          TEXT,
  exclusivity           BOOLEAN           DEFAULT false,
  non_poaching_months   INTEGER           DEFAULT 0,
  confidentiality       BOOLEAN           DEFAULT true,
  draft_doc_url         VARCHAR(1000),
  signed_doc_url        VARCHAR(1000),
  approval_status       VARCHAR(30)       DEFAULT 'Pending',
  approved_by           VARCHAR(255),
  approved_at           TIMESTAMP,
  version               INTEGER           NOT NULL DEFAULT 1,
  parent_contract_id    VARCHAR(50)       REFERENCES contracts(id) ON DELETE SET NULL,
  is_deleted            BOOLEAN           DEFAULT false,
  deleted_at            TIMESTAMP,
  deleted_by            VARCHAR(255),
  notes                 TEXT,
  created_by            VARCHAR(255),
  created_at            TIMESTAMP         NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS con_client_id_idx   ON contracts (client_id);
CREATE INDEX IF NOT EXISTS con_status_idx       ON contracts (status);
CREATE INDEX IF NOT EXISTS con_end_date_idx     ON contracts (contract_end_date);
CREATE INDEX IF NOT EXISTS con_is_deleted_idx   ON contracts (is_deleted);
CREATE INDEX IF NOT EXISTS con_contract_num_idx ON contracts (contract_number);

-- ── 4. Contract documents table (append-only) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_documents (
  id              SERIAL        PRIMARY KEY,
  contract_id     VARCHAR(50)   NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  label           VARCHAR(255)  NOT NULL,
  file_url        VARCHAR(1000) NOT NULL,
  file_name       VARCHAR(255)  NOT NULL,
  file_size_bytes INTEGER,
  uploaded_by     VARCHAR(255),
  uploaded_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cd_contract_id_idx ON contract_documents (contract_id);

-- ── 5. Invoices table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id                  VARCHAR(50)       PRIMARY KEY,
  invoice_number      VARCHAR(60)       NOT NULL UNIQUE,
  client_id           VARCHAR(50)       REFERENCES clients(id) ON DELETE RESTRICT,
  contract_id         VARCHAR(50)       REFERENCES contracts(id) ON DELETE RESTRICT,
  mandate_id          INTEGER           REFERENCES mandates(id) ON DELETE RESTRICT,
  cand_id             VARCHAR(50)       REFERENCES candidates(id) ON DELETE RESTRICT,
  client_snapshot     JSONB             NOT NULL DEFAULT '{}',
  commercial_snapshot JSONB             NOT NULL DEFAULT '{}',
  invoice_date        DATE              NOT NULL,
  due_date            DATE              NOT NULL,
  joining_date        DATE,
  annual_ctc          DOUBLE PRECISION,
  commercial_pct      DOUBLE PRECISION,
  fee_before_tax      DOUBLE PRECISION,
  gst_rate            DOUBLE PRECISION  DEFAULT 18.0,
  gst_amount          DOUBLE PRECISION,
  cgst_amount         DOUBLE PRECISION,
  sgst_amount         DOUBLE PRECISION,
  igst_amount         DOUBLE PRECISION,
  tds_rate            DOUBLE PRECISION  DEFAULT 0,
  tds_amount          DOUBLE PRECISION,
  total_amount        DOUBLE PRECISION,
  currency            VARCHAR(10)       DEFAULT 'INR',
  place_of_supply     VARCHAR(100),
  hsn_sac_code        VARCHAR(20)       DEFAULT '998313',
  po_number           VARCHAR(100),
  status              VARCHAR(30)       NOT NULL DEFAULT 'Draft',
  amount_paid         DOUBLE PRECISION  DEFAULT 0,
  amount_outstanding  DOUBLE PRECISION,
  version             INTEGER           NOT NULL DEFAULT 1,
  parent_invoice_id   VARCHAR(50)       REFERENCES invoices(id) ON DELETE SET NULL,
  cancel_reason       TEXT,
  cancel_by           VARCHAR(255),
  cancelled_at        TIMESTAMP,
  consultant          VARCHAR(255),
  created_by          VARCHAR(255),
  is_deleted          BOOLEAN           DEFAULT false,
  deleted_at          TIMESTAMP,
  deleted_by          VARCHAR(255),
  notes               TEXT,
  created_at          TIMESTAMP         NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inv_client_id_idx   ON invoices (client_id);
CREATE INDEX IF NOT EXISTS inv_contract_id_idx ON invoices (contract_id);
CREATE INDEX IF NOT EXISTS inv_mandate_id_idx  ON invoices (mandate_id);
CREATE INDEX IF NOT EXISTS inv_status_idx       ON invoices (status);
CREATE INDEX IF NOT EXISTS inv_due_date_idx     ON invoices (due_date);
CREATE INDEX IF NOT EXISTS inv_is_deleted_idx   ON invoices (is_deleted);
CREATE INDEX IF NOT EXISTS inv_invoice_num_idx  ON invoices (invoice_number);

-- ── 6. Invoice payments table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_payments (
  id                SERIAL        PRIMARY KEY,
  invoice_id        VARCHAR(50)   NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_date      DATE          NOT NULL,
  amount            DOUBLE PRECISION NOT NULL,
  reference_number  VARCHAR(100),
  utr_number        VARCHAR(100),
  mode              VARCHAR(50),
  notes             TEXT,
  is_reversed       BOOLEAN       DEFAULT false,
  reversed_at       TIMESTAMP,
  reversed_by       VARCHAR(255),
  reversal_reason   TEXT,
  recorded_by       VARCHAR(255),
  created_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ip_invoice_id_idx ON invoice_payments (invoice_id);

-- ── 7. Legal & Finance audit log (immutable — INSERT only) ───────────────────
CREATE TABLE IF NOT EXISTS lf_audit_logs (
  id              BIGSERIAL     PRIMARY KEY,
  entity_type     VARCHAR(30)   NOT NULL,
  entity_id       VARCHAR(100)  NOT NULL,
  action          VARCHAR(50)   NOT NULL,
  actor_name      VARCHAR(255)  NOT NULL,
  actor_role      VARCHAR(50),
  timestamp       TIMESTAMP     NOT NULL DEFAULT NOW(),
  ip_address      VARCHAR(45),
  previous_value  JSONB,
  new_value       JSONB,
  change_reason   TEXT,
  metadata        JSONB         DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS lfa_entity_idx ON lf_audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS lfa_action_idx ON lf_audit_logs (action);
CREATE INDEX IF NOT EXISTS lfa_actor_idx  ON lf_audit_logs (actor_name);
CREATE INDEX IF NOT EXISTS lfa_ts_idx     ON lf_audit_logs (timestamp DESC);

-- Seed initial sequence keys to avoid null on first fetch
INSERT INTO lf_sequences (key, last_val) VALUES ('contract_2026', 0) ON CONFLICT (key) DO NOTHING;
INSERT INTO lf_sequences (key, last_val) VALUES ('invoice_2026', 0)  ON CONFLICT (key) DO NOTHING;
