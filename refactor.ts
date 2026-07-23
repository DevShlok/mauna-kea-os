import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Renaming external_id to cand_id...");
    await db.execute(sql`ALTER TABLE mandate_candidates RENAME COLUMN external_id TO cand_id;`);
    
    console.log("Dropping mandate_candidates columns...");
    await db.execute(sql`ALTER TABLE mandate_candidates DROP COLUMN IF EXISTS name;`);
    await db.execute(sql`ALTER TABLE mandate_candidates DROP COLUMN IF EXISTS company;`);
    await db.execute(sql`ALTER TABLE mandate_candidates DROP COLUMN IF EXISTS role;`);
    await db.execute(sql`ALTER TABLE mandate_candidates DROP COLUMN IF EXISTS initials;`);
    await db.execute(sql`ALTER TABLE mandate_candidates DROP COLUMN IF EXISTS cv_text;`);

    console.log("Dropping floats columns...");
    await db.execute(sql`ALTER TABLE floats DROP COLUMN IF EXISTS cand_name;`);
    await db.execute(sql`ALTER TABLE floats DROP COLUMN IF EXISTS client;`);
    await db.execute(sql`ALTER TABLE floats DROP COLUMN IF EXISTS role;`);

    console.log("Dropping float_followups columns...");
    await db.execute(sql`ALTER TABLE float_followups DROP COLUMN IF EXISTS cand;`);
    await db.execute(sql`ALTER TABLE float_followups DROP COLUMN IF EXISTS client;`);
    await db.execute(sql`ALTER TABLE float_followups DROP COLUMN IF EXISTS role;`);

    console.log("Successfully ran manual SQL refactoring.");
  } catch (err) {
    console.error("Error executing SQL:", err);
  }
}

main().then(() => process.exit(0));
