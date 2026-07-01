import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sql } from "drizzle-orm";

async function main() {
  const { db } = await import("./src/db");
  try {
    await db.execute(sql`ALTER TABLE candidate_reports ADD COLUMN shared_with_client BOOLEAN DEFAULT FALSE`);
    console.log("Migration successful");
  } catch (err) {
    console.error("Migration error:", err);
  }
  process.exit(0);
}
main();
