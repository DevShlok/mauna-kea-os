import { db } from "./index";
import { candidates } from "./schema";
import { sql, eq } from "drizzle-orm";

async function main() {
  const result = await db.execute(sql`
    SELECT id, metadata->>'isPlaceholder' as ph, COALESCE(metadata->>'isPlaceholder', 'false') as val
    FROM candidates 
    WHERE id = 'c2'
  `);
  console.log("SQL execution result:", result);
  process.exit(0);
}

main();
