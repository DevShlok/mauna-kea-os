import { config } from "dotenv";
config({ path: ".env.local" });

if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('pooler.supabase.com:5432')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(':5432', ':6543');
}

import { db } from "../db";
import { timeLogs, leaveRequests } from "../db/schema";
import { sql } from "drizzle-orm";

async function clearData() {
  console.log("Clearing Time Logs...");
  await db.delete(timeLogs);
  console.log("Clearing Leave Requests...");
  await db.delete(leaveRequests);
  console.log("Done.");
  process.exit(0);
}

clearData().catch(e => {
  console.error(e);
  process.exit(1);
});
