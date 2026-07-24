import { db } from "./index";
import { candidates, mandateCandidates } from "./schema";

async function main() {
  const cands = await db.select({ id: candidates.id, name: candidates.name }).from(candidates);
  console.log("All Candidate IDs:", cands.map(c => c.id).join(", "));
  
  const mcs = await db.select({ id: mandateCandidates.id, candId: mandateCandidates.candId }).from(mandateCandidates);
  console.log("All Mandate Candidate candIds:", mcs.map(m => m.candId).join(", "));

  process.exit(0);
}

main();
