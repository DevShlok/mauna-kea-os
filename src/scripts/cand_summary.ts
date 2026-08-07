import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../db";
import { candidates } from "../db/schema";
import { eq, ne, sql } from "drizzle-orm";
import fs from "fs";

async function run() {
  const allCands = await db.select().from(candidates);
  const unknownCands = allCands.filter(c => c.name === "Unknown" || !c.name || c.name.trim() === "");
  const realCands = allCands.filter(c => c.name && c.name !== "Unknown" && c.name.trim() !== "");

  let out = `TOTAL CANDIDATES: ${allCands.length}\n`;
  out += `REAL CANDIDATES COUNT: ${realCands.length}\n`;
  out += `UNKNOWN/EMPTY CANDIDATES COUNT: ${unknownCands.length}\n\n`;

  out += "SAMPLE REAL CANDIDATES:\n";
  for (const c of realCands.slice(0, 10)) {
    out += `ID: ${c.id} | NAME: '${c.name}' | CO: '${c.company}' | ROLE: '${c.designation}' | DATE: ${c.createdAt}\n`;
  }

  out += "\nSAMPLE UNKNOWN CANDIDATES:\n";
  for (const c of unknownCands.slice(0, 10)) {
    out += `ID: ${c.id} | NAME: '${c.name}' | DATE: ${c.createdAt} | IS_DELETED: ${c.isDeleted}\n`;
  }

  fs.writeFileSync("c:/Users/LENOVO/OneDrive/Desktop/Mauna Kea/mauna-kea-os/src/scripts/cand_summary.txt", out);
  console.log("DONE");
  process.exit(0);
}

run();
