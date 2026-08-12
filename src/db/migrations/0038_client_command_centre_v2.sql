-- Migration 0038: Client Command Centre v2
-- Adds: interview rounds config, client decisions, structured rejections,
--       interviews table, client_action_tasks, candidate_activity_log,
--       client_notifications extensions.
-- All statements use IF NOT EXISTS / IF COLUMN DOES NOT EXIST guards.

-- 1. Extend mandates: configurable interview rounds
ALTER TABLE "mandates"
  ADD COLUMN IF NOT EXISTS "interview_rounds" JSONB DEFAULT '[{"round":1,"label":"Interview 1"},{"round":2,"label":"Interview 2"},{"round":3,"label":"Final Interview"}]';

-- 2. Extend mandate_candidates: client decision + interview tracking
ALTER TABLE "mandate_candidates"
  ADD COLUMN IF NOT EXISTS "client_decision"           VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "client_decision_at"        TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "client_rejection_reasons"  JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "client_rejection_other"    TEXT,
  ADD COLUMN IF NOT EXISTS "interview_round_current"   INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS "mc_client_decision_idx" ON "mandate_candidates" ("client_decision");

-- 3. interviews table
CREATE TABLE IF NOT EXISTS "interviews" (
  "id"                    SERIAL PRIMARY KEY,
  "mandate_id"            INTEGER NOT NULL REFERENCES "mandates"("id") ON DELETE CASCADE,
  "mandate_candidate_id"  INTEGER REFERENCES "mandate_candidates"("id") ON DELETE SET NULL,
  "position_id"           INTEGER REFERENCES "mandate_positions"("id") ON DELETE SET NULL,
  "round"                 INTEGER NOT NULL DEFAULT 1,
  "round_label"           VARCHAR(100),
  "interviewer_name"      VARCHAR(255),
  "interviewer_role"      VARCHAR(100),
  "scheduled_date"        DATE,
  "scheduled_time"        VARCHAR(20),
  "status"                VARCHAR(30) DEFAULT 'Scheduled',
  "recommendation"        VARCHAR(50),
  "feedback_text"         TEXT,
  "created_by"            VARCHAR(255),
  "created_at"            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "int_mandate_id_idx"  ON "interviews" ("mandate_id");
CREATE INDEX IF NOT EXISTS "int_mc_id_idx"        ON "interviews" ("mandate_candidate_id");
CREATE INDEX IF NOT EXISTS "int_status_idx"       ON "interviews" ("status");

-- 4. client_action_tasks (Next Steps task tracking)
CREATE TABLE IF NOT EXISTS "client_action_tasks" (
  "id"                    SERIAL PRIMARY KEY,
  "mandate_id"            INTEGER NOT NULL REFERENCES "mandates"("id") ON DELETE CASCADE,
  "client_id"             VARCHAR(50) REFERENCES "clients"("id") ON DELETE SET NULL,
  "selected_steps"        JSONB DEFAULT '[]',
  "free_text_comment"     TEXT,
  "submitted_by"          VARCHAR(255),
  "submitted_by_name"     VARCHAR(255),
  "submitted_at"          TIMESTAMP DEFAULT NOW(),
  "status"                VARCHAR(30) DEFAULT 'Open',
  "acknowledged_by"       VARCHAR(255),
  "acknowledged_at"       TIMESTAMP,
  "completed_by"          VARCHAR(255),
  "completed_at"          TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "cat_mandate_id_idx"   ON "client_action_tasks" ("mandate_id");
CREATE INDEX IF NOT EXISTS "cat_client_id_idx"    ON "client_action_tasks" ("client_id");
CREATE INDEX IF NOT EXISTS "cat_status_idx"       ON "client_action_tasks" ("status");

-- 5. candidate_activity_log (per mandate-candidate timeline)
CREATE TABLE IF NOT EXISTS "candidate_activity_log" (
  "id"                    SERIAL PRIMARY KEY,
  "mandate_id"            INTEGER REFERENCES "mandates"("id") ON DELETE SET NULL,
  "mandate_candidate_id"  INTEGER REFERENCES "mandate_candidates"("id") ON DELETE SET NULL,
  "action_type"           VARCHAR(80) NOT NULL,
  "description"           TEXT NOT NULL,
  "previous_state"        VARCHAR(100),
  "new_state"             VARCHAR(100),
  "performed_by"          VARCHAR(255),
  "performed_by_role"     VARCHAR(50),
  "performed_at"          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "cal_mc_id_idx"        ON "candidate_activity_log" ("mandate_candidate_id");
CREATE INDEX IF NOT EXISTS "cal_mandate_id_idx"   ON "candidate_activity_log" ("mandate_id");
CREATE INDEX IF NOT EXISTS "cal_performed_at_idx" ON "candidate_activity_log" ("performed_at" DESC);

-- 6. Extend client_notifications with type / user_id / title
ALTER TABLE "client_notifications"
  ADD COLUMN IF NOT EXISTS "type"    VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "user_id" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "title"   VARCHAR(255);

CREATE INDEX IF NOT EXISTS "cn_type_idx"    ON "client_notifications" ("type");
CREATE INDEX IF NOT EXISTS "cn_is_read_idx" ON "client_notifications" ("is_read");
