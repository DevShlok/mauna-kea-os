import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { db } from "@/db";
import { candidateReports } from "@/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const targetCandId = "CAND-1780956600206";
  console.log(`=== Inspecting Candidate Reports for ${targetCandId} ===`);

  const reports = await db
    .select()
    .from(candidateReports)
    .where(eq(candidateReports.candidateId, targetCandId));

  console.log(`Found ${reports.length} report(s):`);
  for (const r of reports) {
    console.log(`- ID: ${r.id} | Framework: ${r.frameworkId} | Status: ${r.status} | CreatedAt: ${r.createdAt}`);
    console.log(`  ReportData Keys: ${Object.keys((r.reportData as object) || {}).join(", ")}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error inspecting reports:", err);
  process.exit(1);
});
