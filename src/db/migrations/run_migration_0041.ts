// Run: npx tsx --env-file=.env.local src/db/migrations/run_migration_0041.ts
import { db } from "@/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Running migration 0041: Add payroll fields to platform_users...");

  await db.execute(sql`
    ALTER TABLE "platform_users"
      ADD COLUMN IF NOT EXISTS "employee_code"   VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "designation"     VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "department"      VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "date_of_joining" DATE,
      ADD COLUMN IF NOT EXISTS "pan"             VARCHAR(20),
      ADD COLUMN IF NOT EXISTS "bank_account"    VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "bank_name"       VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "ifsc"            VARCHAR(20)
  `);

  console.log("✅ Migration 0041 complete: employee_code, designation, department, date_of_joining, pan, bank_account, bank_name, ifsc added to platform_users.");
  process.exit(0);
}

run().catch((e) => {
  console.error("Migration 0041 failed:", e);
  process.exit(1);
});
