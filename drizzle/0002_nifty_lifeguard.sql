CREATE TABLE "master_clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"industry" varchar(255),
	"account_owner" varchar(255),
	"hr_leader_name" varchar(255),
	"phone" varchar(100),
	"designation" varchar(255),
	"linkedin_url" varchar(1000),
	"source_url" varchar(1000),
	"source_type" varchar(100),
	"confidence" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "master_industries" (
	"id" serial PRIMARY KEY NOT NULL,
	"sector_name" varchar(255) NOT NULL,
	"includes_consolidated_from" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "master_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"raw_entry" varchar(255) NOT NULL,
	"standardized_location" varchar(255) NOT NULL,
	"mapping_action" text,
	"created_at" timestamp DEFAULT now()
);
