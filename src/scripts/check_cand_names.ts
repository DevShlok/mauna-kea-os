import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../db";
import { candidates } from "../db/schema";
import { desc, isNull, ne } from "drizzle-orm";
import fs from "fs";

async function run() {
  const rows = await db.select({
    id: candidates.id,
    name: candidates.name,
    company: candidates.company,
    designation: candidates.designation,
    createdAt: candidates.createdAt
  }).from(candidates).orderBy(desc(candidates.createdAt)).limit(30);

  let out = "TOTAL ROWS RETURNED: " + rows.length + "\n";
  for (const r of rows) {
    out += `ID: ${r.id} | NAME: '${r.name}' | COMPANY: '${r.company}' | DESIG: '${r.designation}' | DATE: ${r.createdAt}\n`;
  }

  fs.writeFileSync("c:/Users/LENOVO/OneDrive/Desktop/Mauna Kea/mauna-kea-os/src/scripts/cand_out.txt", out);
  console.log("DONE WRITING CAND OUT");
  process.exit(0);
}

run();
