import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../db";
import { candidates } from "../db/schema";
import { eq, sql } from "drizzle-orm";

async function run() {
  const rows = await db.select({ id: candidates.id, metadata: candidates.metadata }).from(candidates);
  console.log("Total candidates to inspect:", rows.length);

  let cleanedCount = 0;
  for (const r of rows) {
    const rawStr = JSON.stringify(r.metadata || {});
    if (rawStr && (rawStr.includes("\\u0000") || rawStr.includes("\\u0011") || rawStr.includes("ࡱ"))) {
      await db.update(candidates).set({ metadata: {} }).where(eq(candidates.id, r.id));
      cleanedCount++;
    }
  }

  console.log("METADATA SANITIZED! Cleaned count:", cleanedCount);
  process.exit(0);
}

run();
