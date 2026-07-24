import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
  const reports = await db.execute(sql`SELECT candidate_id, report_data FROM candidate_reports WHERE candidate_id IN ('c2', 'c3', 'c6', 'c7', 'c8') LIMIT 2`);
  console.log("Candidate Reports:", JSON.stringify(reports, null, 2));

  process.exit(0);
}

main();
