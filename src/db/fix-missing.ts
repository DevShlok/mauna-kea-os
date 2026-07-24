import { db } from "./index";
import { candidates, mandateCandidates } from "./schema";
import { sql } from "drizzle-orm";

async function main() {
  const mcs = await db.select({ candId: mandateCandidates.candId }).from(mandateCandidates);
  const candIds = Array.from(new Set(mcs.map(m => m.candId)));
  
  for (const id of candIds) {
    const existing = await db.select().from(candidates).where(sql`${candidates.id} = ${id}`);
    if (existing.length === 0) {
      await db.insert(candidates).values({
        id,
        name: `Candidate ${id}`,
        initials: "UN",
        status: "Active",
      });
      console.log(`Inserted placeholder for missing candidate: ${id}`);
    }
  }

  // Also do floats just in case
  const floatsData = await db.select({ candId: sql<string>`cand_id` }).from(sql`floats`);
  const floatCandIds = Array.from(new Set(floatsData.map(f => f.candId).filter(Boolean)));
  for (const id of floatCandIds) {
    const existing = await db.select().from(candidates).where(sql`${candidates.id} = ${id}`);
    if (existing.length === 0) {
      await db.insert(candidates).values({
        id,
        name: `Candidate ${id}`,
        initials: "UN",
        status: "Active",
      });
      console.log(`Inserted placeholder for missing float candidate: ${id}`);
    }
  }
  
  process.exit(0);
}

main();
