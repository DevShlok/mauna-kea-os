import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Adding client and role back to floats...");
    await db.execute(sql`ALTER TABLE floats ADD COLUMN IF NOT EXISTS client VARCHAR(255);`);
    await db.execute(sql`ALTER TABLE floats ADD COLUMN IF NOT EXISTS role VARCHAR(255);`);

    console.log("Adding client and role back to float_followups...");
    await db.execute(sql`ALTER TABLE float_followups ADD COLUMN IF NOT EXISTS client VARCHAR(255);`);
    await db.execute(sql`ALTER TABLE float_followups ADD COLUMN IF NOT EXISTS role VARCHAR(255);`);

    console.log("Successfully ran manual SQL refactoring.");
  } catch (err) {
    console.error("Error executing SQL:", err);
  }
}

main().then(() => process.exit(0));
