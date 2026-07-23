import 'dotenv/config';
import { db } from "./src/db";
import { candidates } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const allCands = await db.select().from(candidates);
  
  let updatedCount = 0;

  for (const c of allCands) {
    if (!c.metadata) continue;

    const metadata = c.metadata as Record<string, any>;
    const updates: any = {};

    // Extract Qualification
    const qual = metadata["Qualification"];
    if (qual && (!c.qual || c.qual.length === 0)) {
      updates.qual = [qual];
    }

    // Extract Linkedin
    const linkedin = metadata["Linkedin profile Link"];
    if (linkedin && !c.linkedin) {
      updates.linkedin = linkedin;
    }

    // Extract mobile if empty
    const mobile2 = metadata["Phone Number 2"];
    if (mobile2 && !c.mobile) {
      updates.mobile = mobile2;
    }

    if (Object.keys(updates).length > 0) {
      await db.update(candidates).set(updates).where(eq(candidates.id, c.id));
      updatedCount++;
      console.log(`Updated candidate ${c.name} with`, Object.keys(updates));
    }
  }

  console.log(`Successfully updated ${updatedCount} candidates.`);
  process.exit(0);
}
main();
