// Run: npx tsx --env-file=.env.local src/db/migrations/run_migration_0042.ts
import { db } from "@/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Running migration 0042: Add client_user_department_access and client_user_mandate_access...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "client_user_department_access" (
      "id" SERIAL PRIMARY KEY,
      "user_id" VARCHAR(50) NOT NULL REFERENCES "platform_users"("id") ON DELETE CASCADE,
      "department_id" INTEGER NOT NULL REFERENCES "departments"("id") ON DELETE CASCADE,
      "granted_by" VARCHAR(255),
      "created_at" TIMESTAMP DEFAULT NOW(),
      CONSTRAINT "cuda_user_dept_uniq" UNIQUE("user_id", "department_id")
    );

    CREATE INDEX IF NOT EXISTS "cuda_user_id_idx" ON "client_user_department_access" ("user_id");

    CREATE TABLE IF NOT EXISTS "client_user_mandate_access" (
      "id" SERIAL PRIMARY KEY,
      "user_id" VARCHAR(50) NOT NULL REFERENCES "platform_users"("id") ON DELETE CASCADE,
      "mandate_id" INTEGER NOT NULL REFERENCES "mandates"("id") ON DELETE CASCADE,
      "granted_by" VARCHAR(255),
      "created_at" TIMESTAMP DEFAULT NOW(),
      CONSTRAINT "cuma_user_mandate_uniq" UNIQUE("user_id", "mandate_id")
    );

    CREATE INDEX IF NOT EXISTS "cuma_user_id_idx" ON "client_user_mandate_access" ("user_id");
  `);

  console.log("✅ Migration 0042 complete.");
  process.exit(0);
}

run().catch((e) => {
  console.error("Migration 0042 failed:", e);
  process.exit(1);
});
