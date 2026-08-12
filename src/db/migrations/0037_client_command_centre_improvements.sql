-- Migration 0037: Client Command Centre Improvements (Departments, Mandate Positions, Visibility Controls, Dual Rankings, Download Logs)

CREATE TABLE IF NOT EXISTS "departments" (
  "id" SERIAL PRIMARY KEY,
  "tenant_id" VARCHAR(255),
  "client_id" VARCHAR(50) NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "dept_client_id_idx" ON "departments" ("client_id");

ALTER TABLE "mandates" ADD COLUMN IF NOT EXISTS "department_id" INTEGER REFERENCES "departments"("id") ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS "mandate_positions" (
  "id" SERIAL PRIMARY KEY,
  "mandate_id" INTEGER NOT NULL REFERENCES "mandates"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "job_description" TEXT,
  "location" VARCHAR(255),
  "min_compensation" DOUBLE PRECISION,
  "max_compensation" DOUBLE PRECISION,
  "status" VARCHAR(50) DEFAULT 'Open',
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "mp_mandate_id_idx" ON "mandate_positions" ("mandate_id");

ALTER TABLE "mandate_candidates" ADD COLUMN IF NOT EXISTS "visible_to_client" BOOLEAN DEFAULT FALSE;
ALTER TABLE "mandate_candidates" ADD COLUMN IF NOT EXISTS "show_contact_details" BOOLEAN DEFAULT FALSE;
ALTER TABLE "mandate_candidates" ADD COLUMN IF NOT EXISTS "show_compensation" BOOLEAN DEFAULT TRUE;
ALTER TABLE "mandate_candidates" ADD COLUMN IF NOT EXISTS "show_assessment" BOOLEAN DEFAULT TRUE;
ALTER TABLE "mandate_candidates" ADD COLUMN IF NOT EXISTS "show_comments" BOOLEAN DEFAULT TRUE;
ALTER TABLE "mandate_candidates" ADD COLUMN IF NOT EXISTS "consultant_ranking" VARCHAR(10);
ALTER TABLE "mandate_candidates" ADD COLUMN IF NOT EXISTS "client_ranking" VARCHAR(10);
ALTER TABLE "mandate_candidates" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;
ALTER TABLE "mandate_candidates" ADD COLUMN IF NOT EXISTS "rejection_category" VARCHAR(100);

CREATE TABLE IF NOT EXISTS "download_logs" (
  "id" SERIAL PRIMARY KEY,
  "tenant_id" VARCHAR(255),
  "user_id" VARCHAR(255) NOT NULL,
  "user_name" VARCHAR(255) NOT NULL,
  "user_role" VARCHAR(50) NOT NULL,
  "mandate_id" INTEGER REFERENCES "mandates"("id") ON DELETE SET NULL,
  "candidate_id" VARCHAR(50) REFERENCES "candidates"("id") ON DELETE SET NULL,
  "document_type" VARCHAR(100) NOT NULL,
  "ip_address" VARCHAR(100),
  "downloaded_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "dl_mandate_id_idx" ON "download_logs" ("mandate_id");
CREATE INDEX IF NOT EXISTS "dl_cand_id_idx" ON "download_logs" ("candidate_id");
