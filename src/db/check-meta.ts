import { db } from "./index";
import { candidates } from "./schema";
import { sql, eq } from "drizzle-orm";

async function main() {
  const c2 = await db.select({ metadata: candidates.metadata }).from(candidates).where(eq(candidates.id, 'c2'));
  console.log("c2 metadata:", c2[0]?.metadata);
  process.exit(0);
}

main();
