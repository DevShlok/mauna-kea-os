// Run from project root: npx tsx --env-file=.env.local src/db/migrations/run_migration_0040.ts
import { db } from "@/db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function run() {
  console.log("Running migration 0040: Payroll foundation tables...");

  const migrationSQL = fs.readFileSync(
    path.join(process.cwd(), "src", "db", "migrations", "0040_payroll_foundation.sql"),
    "utf-8"
  );

  // Strip comment lines (-- ...) then split on semicolons
  const stripped = migrationSQL
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

  const statements = stripped
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 4); // ignore tiny fragments

  console.log(`  Found ${statements.length} SQL statements to execute.`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.slice(0, 60).replace(/\n/g, " ");
    console.log(`  [${i + 1}/${statements.length}] ${preview}...`);
    await db.execute(sql.raw(stmt));
  }

  console.log("✅ Migration 0040 complete.");
  console.log("   Tables: employee_ctc_master, payroll_runs, payroll_line_items, payroll_leave_summary, payroll_audit_log");
  process.exit(0);
}

run().catch((e) => {
  console.error("Migration 0040 failed:", e);
  process.exit(1);
});
