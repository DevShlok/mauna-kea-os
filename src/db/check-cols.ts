import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'mandate_candidates';
  `);
  console.log("Columns in mandate_candidates:");
  console.log(result);
  process.exit(0);
}

main();
