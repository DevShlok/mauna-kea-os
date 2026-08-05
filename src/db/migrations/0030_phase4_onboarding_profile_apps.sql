-- ─── PHASE 4: Candidate Onboarding, Profile & Applications ───

-- 1. Extend candidates table
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "profile_completed_at" timestamp;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "onboarding_source" varchar(20);
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "certifications" json DEFAULT '[]'::json;

-- 2. Create candidate_career_timeline table
CREATE TABLE IF NOT EXISTS "candidate_career_timeline" (
	"id" serial PRIMARY KEY NOT NULL,
	"cand_id" varchar(50) NOT NULL,
	"role_title" varchar(255) NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"description" text,
	"is_current" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);

-- 3. Create candidate_badges table
CREATE TABLE IF NOT EXISTS "candidate_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"cand_id" varchar(50) NOT NULL,
	"badge_type" varchar(50) NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL,
	"metadata" json
);

-- 4. Create candidate_applications table
CREATE TABLE IF NOT EXISTS "candidate_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"cand_id" varchar(50) NOT NULL,
	"source" varchar(50) DEFAULT 'direct',
	"job_id" integer,
	"mandate_id" integer,
	"status" varchar(50) DEFAULT 'Profile Submitted',
	"applied_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Foreign Keys
DO $$ BEGIN
 ALTER TABLE "candidate_career_timeline" ADD CONSTRAINT "candidate_career_timeline_cand_id_candidates_id_fk" FOREIGN KEY ("cand_id") REFERENCES "candidates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "candidate_badges" ADD CONSTRAINT "candidate_badges_cand_id_candidates_id_fk" FOREIGN KEY ("cand_id") REFERENCES "candidates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "candidate_applications" ADD CONSTRAINT "candidate_applications_cand_id_candidates_id_fk" FOREIGN KEY ("cand_id") REFERENCES "candidates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "candidate_applications" ADD CONSTRAINT "candidate_applications_job_id_candidate_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "candidate_jobs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "candidate_applications" ADD CONSTRAINT "candidate_applications_mandate_id_mandates_id_fk" FOREIGN KEY ("mandate_id") REFERENCES "mandates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Indexes & Unique Constraints
CREATE INDEX IF NOT EXISTS "cct_cand_id_idx" ON "candidate_career_timeline" ("cand_id");
CREATE INDEX IF NOT EXISTS "cct_start_date_idx" ON "candidate_career_timeline" ("cand_id","start_date");

CREATE INDEX IF NOT EXISTS "cb_cand_id_idx" ON "candidate_badges" ("cand_id");
DO $$ BEGIN
  ALTER TABLE "candidate_badges" ADD CONSTRAINT "cb_cand_badge_uniq" UNIQUE("cand_id","badge_type");
EXCEPTION
 WHEN duplicate_table THEN null;
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "ca_cand_id_idx" ON "candidate_applications" ("cand_id");
