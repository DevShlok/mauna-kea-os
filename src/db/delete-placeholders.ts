import { db } from "./index";
import { candidates, mandateCandidates, floats, floatFollowUps } from "./schema";
import { sql, eq, inArray } from "drizzle-orm";

async function main() {
  console.log("Fetching placeholder candidate IDs...");
  const cands = await db.select({ id: candidates.id }).from(candidates).where(
    sql`COALESCE(metadata->>'isPlaceholder', 'false') = 'true'`
  );
  
  const ids = cands.map(c => c.id);
  
  if (ids.length === 0) {
    console.log("No placeholder candidates found to delete.");
    process.exit(0);
  }
  
  console.log(`Found ${ids.length} placeholder candidates to delete. Removing from referencing tables first...`);
  
  // Delete from float_followups
  await db.delete(floatFollowUps).where(inArray(floatFollowUps.candId, ids));
  
  // Delete from floats
  await db.delete(floats).where(inArray(floats.candId, ids));
  
  // Delete from mandateCandidates
  await db.delete(mandateCandidates).where(inArray(mandateCandidates.candId, ids));
  
  // Finally, delete from candidates
  await db.delete(candidates).where(inArray(candidates.id, ids));
  
  console.log("Successfully deleted all placeholder entries from the database.");
  process.exit(0);
}

main();
