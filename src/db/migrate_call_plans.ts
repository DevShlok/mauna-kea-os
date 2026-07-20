import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Starting manual migration for call_plans...");
  try {
    // Drop old columns
    await db.execute(sql`ALTER TABLE call_plans DROP COLUMN IF EXISTS target_calls CASCADE`);
    await db.execute(sql`ALTER TABLE call_plans DROP COLUMN IF EXISTS completed_calls CASCADE`);
    await db.execute(sql`ALTER TABLE call_plans DROP COLUMN IF EXISTS pending_reason CASCADE`);
    await db.execute(sql`ALTER TABLE call_plans DROP COLUMN IF EXISTS carry_forward_count CASCADE`);
    
    // Add new JSON columns
    await db.execute(sql`ALTER TABLE call_plans ADD COLUMN IF NOT EXISTS target_cand_ids json DEFAULT '[]'::json`);
    await db.execute(sql`ALTER TABLE call_plans ADD COLUMN IF NOT EXISTS target_client_ids json DEFAULT '[]'::json`);
    
    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  }
  process.exit(0);
}

main();
