-- Migration 0040: Payroll Foundation
-- Creates 5 tables: employee_ctc_master, payroll_runs, payroll_line_items, payroll_leave_summary, payroll_audit_log

-- ─── Employee CTC Master ──────────────────────────────────────────────────────
-- Stores each revision of an employee's CTC structure. Never overwritten; each
-- salary revision is a new row with a new effective_date.
CREATE TABLE IF NOT EXISTS "employee_ctc_master" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR(50) NOT NULL REFERENCES "platform_users"("id") ON DELETE CASCADE,
  "effective_date" DATE NOT NULL,
  "annual_ctc" DOUBLE PRECISION NOT NULL,
  "basic_pct" DOUBLE PRECISION NOT NULL DEFAULT 40,
  "hra_pct" DOUBLE PRECISION NOT NULL DEFAULT 20,
  "special_allowance_pct" DOUBLE PRECISION NOT NULL DEFAULT 40,
  "pf_applicable" BOOLEAN NOT NULL DEFAULT TRUE,
  "pf_employee_pct" DOUBLE PRECISION NOT NULL DEFAULT 12,
  "pf_employer_pct" DOUBLE PRECISION NOT NULL DEFAULT 12,
  "professional_tax_monthly" DOUBLE PRECISION NOT NULL DEFAULT 200,
  "tds_monthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "other_allowances" JSONB NOT NULL DEFAULT '[]',
  "other_deductions" JSONB NOT NULL DEFAULT '[]',
  "created_by" VARCHAR(255),
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("user_id", "effective_date")
);
CREATE INDEX IF NOT EXISTS "ectc_user_id_idx" ON "employee_ctc_master" ("user_id");
CREATE INDEX IF NOT EXISTS "ectc_eff_date_idx" ON "employee_ctc_master" ("user_id", "effective_date" DESC);

-- ─── Payroll Runs ─────────────────────────────────────────────────────────────
-- One row per calendar month. Status: Draft → Processed → Approved → Finalized.
CREATE TABLE IF NOT EXISTS "payroll_runs" (
  "id" SERIAL PRIMARY KEY,
  "month" VARCHAR(7) NOT NULL UNIQUE,  -- 'YYYY-MM'
  "status" VARCHAR(20) NOT NULL DEFAULT 'Draft',  -- Draft | Processed | Approved | Finalized
  "total_gross_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total_net_pay" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total_employees" INTEGER NOT NULL DEFAULT 0,
  "processed_by" VARCHAR(255),
  "processed_at" TIMESTAMP,
  "approved_by" VARCHAR(255),
  "approved_at" TIMESTAMP,
  "finalized_by" VARCHAR(255),
  "finalized_at" TIMESTAMP,
  "notes" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Payroll Line Items ───────────────────────────────────────────────────────
-- One row per employee per payroll run. All computed earnings + deductions stored.
CREATE TABLE IF NOT EXISTS "payroll_line_items" (
  "id" SERIAL PRIMARY KEY,
  "run_id" INTEGER NOT NULL REFERENCES "payroll_runs"("id") ON DELETE CASCADE,
  "user_id" VARCHAR(50) NOT NULL REFERENCES "platform_users"("id") ON DELETE CASCADE,
  -- Snapshot employee fields (as of run date)
  "employee_name" VARCHAR(255),
  "employee_code" VARCHAR(50),
  "designation" VARCHAR(255),
  "department" VARCHAR(255),
  "date_of_joining" DATE,
  "pan" VARCHAR(20),
  "bank_account" VARCHAR(50),
  "bank_name" VARCHAR(100),
  "ifsc" VARCHAR(20),
  -- Attendance
  "working_days_in_month" INTEGER NOT NULL DEFAULT 26,
  "paid_days" DOUBLE PRECISION,
  "lop_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lop_override" DOUBLE PRECISION,        -- admin manual override before approval
  "adjustment_note" TEXT,
  -- Earnings
  "basic" DOUBLE PRECISION,
  "hra" DOUBLE PRECISION,
  "special_allowance" DOUBLE PRECISION,
  "other_allowances" JSONB NOT NULL DEFAULT '[]',  -- [{label, amount}]
  "gross_earnings" DOUBLE PRECISION,
  -- Deductions
  "pf_employee" DOUBLE PRECISION,
  "pf_employer" DOUBLE PRECISION,
  "professional_tax" DOUBLE PRECISION,
  "tds" DOUBLE PRECISION,
  "other_deductions" JSONB NOT NULL DEFAULT '[]',  -- [{label, amount}]
  "gross_deductions" DOUBLE PRECISION,
  -- Net
  "net_pay" DOUBLE PRECISION,
  -- Payslip tracking
  "payslip_sent" BOOLEAN NOT NULL DEFAULT FALSE,
  "payslip_sent_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("run_id", "user_id")
);
CREATE INDEX IF NOT EXISTS "pli_run_id_idx" ON "payroll_line_items" ("run_id");
CREATE INDEX IF NOT EXISTS "pli_user_id_idx" ON "payroll_line_items" ("user_id");

-- ─── Payroll Leave Summary ────────────────────────────────────────────────────
-- Pre-computed leave + LOP summary per employee per run, for admin review before approval.
CREATE TABLE IF NOT EXISTS "payroll_leave_summary" (
  "id" SERIAL PRIMARY KEY,
  "run_id" INTEGER NOT NULL REFERENCES "payroll_runs"("id") ON DELETE CASCADE,
  "user_id" VARCHAR(50) NOT NULL REFERENCES "platform_users"("id") ON DELETE CASCADE,
  "annual_quota" DOUBLE PRECISION NOT NULL DEFAULT 24,
  "leaves_taken_ytd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "leaves_taken_this_month" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "balance_remaining" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lop_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "flagged" BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE if over annual quota
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("run_id", "user_id")
);
CREATE INDEX IF NOT EXISTS "pls_run_id_idx" ON "payroll_leave_summary" ("run_id");

-- ─── Payroll Audit Log ────────────────────────────────────────────────────────
-- Immutable INSERT-only log for every payroll action (Process/Approve/Finalize/Override).
CREATE TABLE IF NOT EXISTS "payroll_audit_log" (
  "id" SERIAL PRIMARY KEY,
  "run_id" INTEGER REFERENCES "payroll_runs"("id") ON DELETE SET NULL,
  "action" VARCHAR(80) NOT NULL,
  "actor_name" VARCHAR(255),
  "actor_id" VARCHAR(50),
  "performed_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "notes" TEXT
);
CREATE INDEX IF NOT EXISTS "pal_run_id_idx" ON "payroll_audit_log" ("run_id");
CREATE INDEX IF NOT EXISTS "pal_performed_at_idx" ON "payroll_audit_log" ("performed_at");
