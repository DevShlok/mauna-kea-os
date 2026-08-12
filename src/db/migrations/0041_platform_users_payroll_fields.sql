-- Migration 0041: Add payroll-specific profile fields to platform_users
-- These are snapshotted into payroll_line_items at run time so payslips remain
-- accurate even if the employee's profile changes later.

ALTER TABLE "platform_users"
  ADD COLUMN IF NOT EXISTS "employee_code"   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "designation"     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "department"      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "date_of_joining" DATE,
  ADD COLUMN IF NOT EXISTS "pan"             VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "bank_account"    VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "bank_name"       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "ifsc"            VARCHAR(20);
