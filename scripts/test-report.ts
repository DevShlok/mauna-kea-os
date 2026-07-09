import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "../src/db";
import { candidateReports } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  const r = await db.select().from(candidateReports).where(eq(candidateReports.candidateId, "CAND-1780956600206"));
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
}
run();
