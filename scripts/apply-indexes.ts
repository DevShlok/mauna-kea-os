import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const connection = postgres(dbUrl, { prepare: false });
const db = drizzle(connection);

const indexes = [
  `CREATE INDEX IF NOT EXISTS "candidate_files_cand_id_idx" ON "candidate_files" USING btree ("cand_id");`,
  `CREATE INDEX IF NOT EXISTS "candidate_reports_candidate_id_idx" ON "candidate_reports" USING btree ("candidate_id");`,
  `CREATE INDEX IF NOT EXISTS "candidate_reports_framework_id_idx" ON "candidate_reports" USING btree ("framework_id");`,
  `CREATE INDEX IF NOT EXISTS "client_notifications_client_id_idx" ON "client_notifications" USING btree ("client_id");`,
  `CREATE INDEX IF NOT EXISTS "client_notifications_mandate_id_idx" ON "client_notifications" USING btree ("mandate_id");`,
  `CREATE INDEX IF NOT EXISTS "client_remarks_client_id_idx" ON "client_remarks" USING btree ("client_id");`,
  `CREATE INDEX IF NOT EXISTS "client_remarks_mandate_id_idx" ON "client_remarks" USING btree ("mandate_id");`,
  `CREATE INDEX IF NOT EXISTS "client_remarks_cand_id_idx" ON "client_remarks" USING btree ("cand_id");`,
  `CREATE INDEX IF NOT EXISTS "float_activities_cand_id_idx" ON "float_activities" USING btree ("cand_id");`,
  `CREATE INDEX IF NOT EXISTS "float_followups_cand_id_idx" ON "float_followups" USING btree ("cand_id");`,
  `CREATE INDEX IF NOT EXISTS "float_references_cand_id_idx" ON "float_references" USING btree ("cand_id");`,
  `CREATE INDEX IF NOT EXISTS "floats_cand_id_idx" ON "floats" USING btree ("cand_id");`,
  `CREATE INDEX IF NOT EXISTS "framework_categories_framework_id_idx" ON "framework_categories" USING btree ("framework_id");`,
  `CREATE INDEX IF NOT EXISTS "framework_criteria_category_id_idx" ON "framework_criteria" USING btree ("category_id");`,
  `CREATE INDEX IF NOT EXISTS "leave_requests_user_id_idx" ON "leave_requests" USING btree ("user_id");`,
  `CREATE INDEX IF NOT EXISTS "leave_requests_status_idx" ON "leave_requests" USING btree ("status");`,
  `CREATE INDEX IF NOT EXISTS "mandate_candidates_mandate_id_idx" ON "mandate_candidates" USING btree ("mandate_id");`,
  `CREATE INDEX IF NOT EXISTS "mandates_company_idx" ON "mandates" USING btree ("company");`,
  `CREATE INDEX IF NOT EXISTS "mandates_status_idx" ON "mandates" USING btree ("status");`,
  `CREATE INDEX IF NOT EXISTS "mandates_internal_status_idx" ON "mandates" USING btree ("internal_status");`,
  `CREATE INDEX IF NOT EXISTS "platform_users_linked_client_id_idx" ON "platform_users" USING btree ("linked_client_id");`,
  `CREATE INDEX IF NOT EXISTS "platform_users_linked_candidate_id_idx" ON "platform_users" USING btree ("linked_candidate_id");`,
  `CREATE INDEX IF NOT EXISTS "platform_users_reporting_manager_id_idx" ON "platform_users" USING btree ("reporting_manager_id");`,
  `CREATE INDEX IF NOT EXISTS "time_logs_user_id_idx" ON "time_logs" USING btree ("user_id");`,
  `CREATE INDEX IF NOT EXISTS "time_logs_date_string_idx" ON "time_logs" USING btree ("date_string");`
];

async function main() {
  console.log("Adding indexes to database...");
  for (const index of indexes) {
    try {
      await db.execute(sql.raw(index));
      console.log(`✅ Executed: ${index}`);
    } catch (e: any) {
      console.error(`❌ Failed: ${index}`, e.message);
    }
  }
  console.log("Finished adding indexes!");
  process.exit(0);
}

main();
