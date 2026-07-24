import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
  const files = await db.execute(sql`SELECT * FROM candidate_files WHERE cand_id IN ('c2', 'c3', 'c6', 'c7', 'c8')`);
  console.log("Candidate Files:", files);

  process.exit(0);
}

main();
