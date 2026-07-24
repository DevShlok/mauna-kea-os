import { db } from "./index";
import { candidates } from "./schema";
import { sql, and, eq } from "drizzle-orm";

async function main() {
  const cands = await db.select().from(candidates).where(
    and(
      eq(candidates.initials, 'UN'),
      sql`(name LIKE 'Candidate c%' OR name LIKE 'Candidate CAND%')`
    )
  );

  for (const c of cands) {
    const meta = c.metadata || {};
    meta.isPlaceholder = true;
    await db.update(candidates).set({ metadata: meta }).where(eq(candidates.id, c.id));
  }
    
  console.log("Updated metadata for placeholder candidates to hide them from the main Candidate DB.");
  process.exit(0);
}

main();
