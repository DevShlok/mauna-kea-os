// Run: npx tsx --env-file=.env.local src/db/migrations/run_migration_0043.ts
import { db } from "@/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Running migration 0043: Ensure invoice_payments columns exist...");

  await db.execute(sql`
    ALTER TABLE invoice_payments
      ADD COLUMN IF NOT EXISTS tds_rate DOUBLE PRECISION DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tds_amount DOUBLE PRECISION DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tds_evidence_url TEXT;
  `);

  console.log("✅ Migration 0043 complete.");
  process.exit(0);
}

run().catch((e) => {
  console.error("Migration 0043 failed:", e);
  process.exit(1);
});
