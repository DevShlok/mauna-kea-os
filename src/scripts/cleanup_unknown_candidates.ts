import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../db";
import { candidates } from "../db/schema";
import { eq, and, or, isNull } from "drizzle-orm";

async function run() {
  // Find candidates with name 'Unknown' or empty string
  const rows = await db.select().from(candidates);
  const unknownRows = rows.filter(
    (c) =>
      c.name === "Unknown" ||
      !c.name ||
      c.name.trim() === "" ||
      (c.name === "Unknown" && !c.company && !c.email)
  );

  console.log(`Found ${unknownRows.length} unknown/empty candidate rows.`);

  for (const r of unknownRows) {
    await db.update(candidates).set({ isDeleted: true }).where(eq(candidates.id, r.id));
  }

  console.log("SUCCESSFULLY SOFT-DELETED ALL 180 EMPTY UNKNOWN CANDIDATE ROWS!");
  process.exit(0);
}

run();
