CREATE TABLE "candidate_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"cand_id" varchar(20) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" varchar(1000) NOT NULL,
	"extracted_text" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "candidate_reports" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"candidate_id" varchar(20) NOT NULL,
	"framework_id" varchar(20) NOT NULL,
	"status" varchar(50) DEFAULT 'Generating',
	"report_data" json,
	"shared_with_client" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"initials" varchar(5),
	"name" varchar(255) NOT NULL,
	"mobile" varchar(20),
	"email" varchar(255),
	"location" varchar(100),
	"company" varchar(255),
	"designation" varchar(255),
	"exp" integer,
	"tenure" integer,
	"ctc" integer,
	"fixed_ctc" integer,
	"variable_ctc" integer,
	"expected" integer,
	"notice" integer,
	"status" varchar(50) DEFAULT 'Active',
	"qual" json DEFAULT '[]'::json,
	"dream_roles" json DEFAULT '[]'::json,
	"dream_cos" json DEFAULT '[]'::json,
	"exp_tags" json DEFAULT '[]'::json,
	"score" double precision,
	"assess_date" varchar(20),
	"linkedin" varchar(500),
	"linkedin_pdf" varchar(500),
	"target_company" varchar(255),
	"currency" varchar(20) DEFAULT 'INR',
	"cv_file_name" varchar(255),
	"notes" text,
	"has_cv" boolean DEFAULT false,
	"cv_text" text,
	"profile_pic" text,
	"esops" integer,
	"esop_vesting" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" varchar(50) NOT NULL,
	"mandate_id" integer NOT NULL,
	"message" text NOT NULL,
	"link" varchar(255),
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_remarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" varchar(50) NOT NULL,
	"mandate_id" integer NOT NULL,
	"cand_id" varchar(20) NOT NULL,
	"remark_text" text NOT NULL,
	"status" varchar(50) DEFAULT 'Pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"account_id" varchar(50),
	"vertical" varchar(100),
	"owner" varchar(255),
	"status" varchar(50) DEFAULT 'Active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "consultant_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(10),
	"target_role" varchar(20),
	"message" text NOT NULL,
	"link" varchar(255),
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "float_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"cand_id" varchar(20) NOT NULL,
	"date" varchar(20),
	"time" varchar(20),
	"consultant" varchar(255),
	"note" text,
	"type" varchar(50),
	"is_pinned" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "float_followups" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"cand_id" varchar(20) NOT NULL,
	"cand" varchar(255),
	"client" varchar(255),
	"role" varchar(255),
	"consultant" varchar(255),
	"due_date" varchar(20),
	"status" varchar(20),
	"note" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "float_references" (
	"id" serial PRIMARY KEY NOT NULL,
	"cand_id" varchar(20) NOT NULL,
	"type" varchar(50),
	"name" varchar(255),
	"org" varchar(255),
	"rel" varchar(255),
	"text" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "floats" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"cand_id" varchar(20) NOT NULL,
	"cand_name" varchar(255),
	"client" varchar(255),
	"role" varchar(255),
	"consultant" varchar(255),
	"date_shared" varchar(20),
	"via" json DEFAULT '[]'::json,
	"follow_up" varchar(20),
	"status" varchar(50),
	"response" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "framework_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"framework_id" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"weight" integer DEFAULT 100,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "framework_criteria" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"weight" integer DEFAULT 10,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "frameworks" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"industry" varchar(255),
	"used_in" integer DEFAULT 0,
	"last_modified" varchar(50),
	"report_sections" json DEFAULT '["Relevant Experience","Motivation & Fit","Key Strengths","Areas to Probe","Mauna Kea Recommendation"]'::json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(10) NOT NULL,
	"leave_type" varchar(50) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text,
	"status" varchar(20) DEFAULT 'Pending',
	"admin_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mandate_candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" varchar(20) NOT NULL,
	"mandate_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"company" varchar(255),
	"role" varchar(255),
	"stage" varchar(50) DEFAULT 'universe',
	"score" double precision,
	"has_report" boolean DEFAULT false,
	"is_sent_to_client" boolean DEFAULT false,
	"initials" varchar(5),
	"cv_text" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mandates" (
	"id" serial PRIMARY KEY NOT NULL,
	"company" varchar(255) NOT NULL,
	"role" varchar(255) NOT NULL,
	"ctc" varchar(100),
	"exp" varchar(100),
	"sectors" json DEFAULT '[]'::json,
	"status" varchar(50) DEFAULT 'universe',
	"internal_status" varchar(50) DEFAULT 'contractsent',
	"consultant" varchar(255),
	"opened" varchar(50),
	"target" varchar(50),
	"geography" varchar(255),
	"work_mode" varchar(50),
	"client_poc" varchar(255),
	"poc_email" varchar(255),
	"poc_phone" varchar(50),
	"poc_cc" json DEFAULT '[]'::json,
	"diversity" varchar(255),
	"target_companies" json DEFAULT '[]'::json,
	"jd_url" varchar(1000),
	"interview_notes_url" varchar(1000),
	"additional_docs_url" varchar(1000),
	"jd_text" text,
	"interview_notes_text" text,
	"search_notes" text,
	"additional_docs_text" text,
	"open_questions" text,
	"framework_id" varchar(20),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_users" (
	"id" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'candidate',
	"status" varchar(20) DEFAULT 'Active',
	"last_login" varchar(100),
	"initials" varchar(5),
	"linked_client_id" varchar(50),
	"linked_candidate_id" varchar(20),
	"last_active" timestamp,
	"max_leaves" integer DEFAULT 20,
	"reporting_manager_id" varchar(10),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(10) NOT NULL,
	"action" varchar(20) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"date_string" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate_files" ADD CONSTRAINT "candidate_files_cand_id_candidates_id_fk" FOREIGN KEY ("cand_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_reports" ADD CONSTRAINT "candidate_reports_framework_id_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notifications" ADD CONSTRAINT "client_notifications_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notifications" ADD CONSTRAINT "client_notifications_mandate_id_mandates_id_fk" FOREIGN KEY ("mandate_id") REFERENCES "public"."mandates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_remarks" ADD CONSTRAINT "client_remarks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_remarks" ADD CONSTRAINT "client_remarks_mandate_id_mandates_id_fk" FOREIGN KEY ("mandate_id") REFERENCES "public"."mandates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_remarks" ADD CONSTRAINT "client_remarks_cand_id_candidates_id_fk" FOREIGN KEY ("cand_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "float_activities" ADD CONSTRAINT "float_activities_cand_id_candidates_id_fk" FOREIGN KEY ("cand_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "float_followups" ADD CONSTRAINT "float_followups_cand_id_candidates_id_fk" FOREIGN KEY ("cand_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "float_references" ADD CONSTRAINT "float_references_cand_id_candidates_id_fk" FOREIGN KEY ("cand_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floats" ADD CONSTRAINT "floats_cand_id_candidates_id_fk" FOREIGN KEY ("cand_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "framework_categories" ADD CONSTRAINT "framework_categories_framework_id_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "framework_criteria" ADD CONSTRAINT "framework_criteria_category_id_framework_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."framework_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_user_id_platform_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."platform_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mandate_candidates" ADD CONSTRAINT "mandate_candidates_mandate_id_mandates_id_fk" FOREIGN KEY ("mandate_id") REFERENCES "public"."mandates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_logs" ADD CONSTRAINT "time_logs_user_id_platform_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."platform_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidate_files_cand_id_idx" ON "candidate_files" USING btree ("cand_id");--> statement-breakpoint
CREATE INDEX "candidate_reports_candidate_id_idx" ON "candidate_reports" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "candidate_reports_framework_id_idx" ON "candidate_reports" USING btree ("framework_id");--> statement-breakpoint
CREATE INDEX "client_notifications_client_id_idx" ON "client_notifications" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_notifications_mandate_id_idx" ON "client_notifications" USING btree ("mandate_id");--> statement-breakpoint
CREATE INDEX "client_remarks_client_id_idx" ON "client_remarks" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_remarks_mandate_id_idx" ON "client_remarks" USING btree ("mandate_id");--> statement-breakpoint
CREATE INDEX "client_remarks_cand_id_idx" ON "client_remarks" USING btree ("cand_id");--> statement-breakpoint
CREATE INDEX "float_activities_cand_id_idx" ON "float_activities" USING btree ("cand_id");--> statement-breakpoint
CREATE INDEX "float_followups_cand_id_idx" ON "float_followups" USING btree ("cand_id");--> statement-breakpoint
CREATE INDEX "float_references_cand_id_idx" ON "float_references" USING btree ("cand_id");--> statement-breakpoint
CREATE INDEX "floats_cand_id_idx" ON "floats" USING btree ("cand_id");--> statement-breakpoint
CREATE INDEX "framework_categories_framework_id_idx" ON "framework_categories" USING btree ("framework_id");--> statement-breakpoint
CREATE INDEX "framework_criteria_category_id_idx" ON "framework_criteria" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "leave_requests_user_id_idx" ON "leave_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "leave_requests_status_idx" ON "leave_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mandate_candidates_mandate_id_idx" ON "mandate_candidates" USING btree ("mandate_id");--> statement-breakpoint
CREATE INDEX "mandates_company_idx" ON "mandates" USING btree ("company");--> statement-breakpoint
CREATE INDEX "mandates_status_idx" ON "mandates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mandates_internal_status_idx" ON "mandates" USING btree ("internal_status");--> statement-breakpoint
CREATE INDEX "platform_users_linked_client_id_idx" ON "platform_users" USING btree ("linked_client_id");--> statement-breakpoint
CREATE INDEX "platform_users_linked_candidate_id_idx" ON "platform_users" USING btree ("linked_candidate_id");--> statement-breakpoint
CREATE INDEX "platform_users_reporting_manager_id_idx" ON "platform_users" USING btree ("reporting_manager_id");--> statement-breakpoint
CREATE INDEX "time_logs_user_id_idx" ON "time_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "time_logs_date_string_idx" ON "time_logs" USING btree ("date_string");