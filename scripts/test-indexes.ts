import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const connection = postgres(dbUrl, { prepare: false });
const db = drizzle(connection);

async function checkIndexUsage() {
  console.log("Analyzing Query Plans (with Seq Scans DISABLED to force Index use)...\n");

  // Force Postgres to use Indexes if possible
  await db.execute(sql.raw(`SET enable_seqscan = OFF;`));

  const queries = [
    {
      name: "1. Filtering mandates by company",
      query: `EXPLAIN ANALYZE SELECT * FROM mandates WHERE company = 'Some Company';`
    },
    {
      name: "2. Joining floats with candidates (using foreign key cand_id)",
      query: `EXPLAIN ANALYZE SELECT f.id, c.name FROM floats f JOIN candidates c ON f.cand_id = c.id WHERE f.cand_id = 'C-12345';`
    },
    {
      name: "3. Filtering time_logs by user_id",
      query: `EXPLAIN ANALYZE SELECT * FROM time_logs WHERE user_id = 'U-999';`
    }
  ];

  for (const q of queries) {
    console.log(`--- ${q.name} ---`);
    try {
      const result = await db.execute(sql.raw(q.query));
      for (const row of result) {
        console.log(Object.values(row)[0]);
      }
    } catch (e: any) {
      console.error("Error executing EXPLAIN:", e.message);
    }
    console.log("\n");
  }

  process.exit(0);
}

checkIndexUsage();
