import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const connection = postgres(dbUrl, { prepare: false });
const db = drizzle(connection);

async function checkBucket() {
  try {
    const res = await db.execute(sql.raw(`SELECT id, public FROM storage.buckets WHERE id = 'mauna-kea-documents'`));
    console.log(res);
  } catch (e: any) {
    console.error(e.message);
  }
  process.exit(0);
}

checkBucket();
