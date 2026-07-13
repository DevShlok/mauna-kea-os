DROP INDEX "candidate_files_cand_id_idx";--> statement-breakpoint
DROP INDEX "candidate_reports_candidate_id_idx";--> statement-breakpoint
DROP INDEX "candidate_reports_framework_id_idx";--> statement-breakpoint
DROP INDEX "client_notifications_client_id_idx";--> statement-breakpoint
DROP INDEX "client_notifications_mandate_id_idx";--> statement-breakpoint
DROP INDEX "client_remarks_client_id_idx";--> statement-breakpoint
DROP INDEX "client_remarks_mandate_id_idx";--> statement-breakpoint
DROP INDEX "client_remarks_cand_id_idx";--> statement-breakpoint
DROP INDEX "float_activities_cand_id_idx";--> statement-breakpoint
DROP INDEX "float_followups_cand_id_idx";--> statement-breakpoint
DROP INDEX "float_references_cand_id_idx";--> statement-breakpoint
DROP INDEX "floats_cand_id_idx";--> statement-breakpoint
DROP INDEX "framework_categories_framework_id_idx";--> statement-breakpoint
DROP INDEX "framework_criteria_category_id_idx";--> statement-breakpoint
DROP INDEX "leave_requests_user_id_idx";--> statement-breakpoint
DROP INDEX "leave_requests_status_idx";--> statement-breakpoint
DROP INDEX "mandate_candidates_mandate_id_idx";--> statement-breakpoint
DROP INDEX "mandates_company_idx";--> statement-breakpoint
DROP INDEX "mandates_status_idx";--> statement-breakpoint
DROP INDEX "mandates_internal_status_idx";--> statement-breakpoint
DROP INDEX "platform_users_linked_client_id_idx";--> statement-breakpoint
DROP INDEX "platform_users_linked_candidate_id_idx";--> statement-breakpoint
DROP INDEX "platform_users_reporting_manager_id_idx";--> statement-breakpoint
DROP INDEX "time_logs_user_id_idx";--> statement-breakpoint
DROP INDEX "time_logs_date_string_idx";--> statement-breakpoint
ALTER TABLE "candidate_files" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "candidate_reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "candidates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "client_notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "client_remarks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "consultant_notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "float_activities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "float_followups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "float_references" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "floats" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "framework_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "framework_criteria" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "frameworks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "leave_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "mandate_candidates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "mandates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "platform_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "time_logs" ENABLE ROW LEVEL SECURITY;