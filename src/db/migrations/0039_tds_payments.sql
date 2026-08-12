-- Migration 0039: Add TDS fields to invoice_payments
ALTER TABLE invoice_payments
  ADD COLUMN IF NOT EXISTS tds_rate float DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tds_amount float DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tds_evidence_url text;
