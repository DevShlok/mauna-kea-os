import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import postgres from "postgres";

async function run() {
  const rawUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
  console.log("Connecting to Supabase Postgres...");
  const sql = postgres(rawUrl, { prepare: false, ssl: "require" });

  try {
    console.log("Adding invoice_type...");
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(30) DEFAULT 'TAX_INVOICE';`;
    console.log("Adding parent_invoice_id...");
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS parent_invoice_id VARCHAR(50) REFERENCES invoices(id);`;
    console.log("Adding version...");
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;`;
    console.log("Migration 0035 completed successfully!");
  } catch (err) {
    console.error("Migration 0035 failed:", err);
  } finally {
    await sql.end();
  }
  process.exit(0);
}

run();
