import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Use dynamic import so dotenv config runs first
async function main() {
  console.log("DATABASE_URL is:", process.env.DATABASE_URL ? "defined" : "undefined");
  try {
    const { db } = await import("../src/db");
    const { candidates } = await import("../src/db/schema");
    const cand = await db.select().from(candidates).limit(1);
    console.log("Success! Found candidate:", cand[0]?.id);
  } catch (e) {
    console.log("Error querying candidates via db/index.ts:");
    console.error(e);
  }
  process.exit(0);
}

main();
