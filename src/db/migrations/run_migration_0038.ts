// Run: npx tsx --env-file=.env.local src/db/migrations/run_migration_0038.ts
import { db } from "@/db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function run() {
  console.log("Running migration 0038: Client Command Centre v2...");

  const migrationSQL = fs.readFileSync(
    path.join(process.cwd(), "src", "db", "migrations", "0038_client_command_centre_v2.sql"),
    "utf-8"
  );

  const stripped = migrationSQL
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

  const statements = stripped
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 4);

  console.log(`  Found ${statements.length} SQL statements to execute.`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.slice(0, 60).replace(/\n/g, " ");
    console.log(`  [${i + 1}/${statements.length}] ${preview}...`);
    await db.execute(sql.raw(stmt));
  }

  console.log("✅ Migration 0038 complete.");
  process.exit(0);
}

run().catch((e) => {
  console.error("Migration 0038 failed:", e);
  process.exit(1);
});
