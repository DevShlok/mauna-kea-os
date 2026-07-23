import 'dotenv/config';
import { db } from "./src/db";
import { candidates } from "./src/db/schema";
import { isNotNull, sql } from "drizzle-orm";

async function main() {
  const allCands = await db.select().from(candidates).limit(100);
  
  for (const c of allCands) {
    let hasExtra = false;
    if (c.metadata && Object.keys(c.metadata).length > 0) hasExtra = true;
    if (c.notes && c.notes.includes("Additional Information")) hasExtra = true;
    
    if (hasExtra) {
       console.log("Candidate:", c.name);
       if (c.metadata) console.log("Metadata:", c.metadata);
       if (c.notes) console.log("Notes:", c.notes);
       console.log("-----------------------");
    }
  }
  process.exit(0);
}
main();
