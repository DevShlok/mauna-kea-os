import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const connection = postgres(dbUrl, { prepare: false });
const db = drizzle(connection);

async function checkFiles() {
  try {
    const files = await db.execute(sql.raw(`SELECT id, file_name, left(file_url, 100) as url_preview FROM candidate_files LIMIT 10`));
    console.log("candidate_files:", files);
    
    const candidates = await db.execute(sql.raw(`SELECT id, profile_pic FROM candidates WHERE profile_pic IS NOT NULL LIMIT 5`));
    console.log("candidates profile_pics:", candidates.map(c => ({...c, profile_pic: c.profile_pic.substring(0, 50)})));
    
    const mandates = await db.execute(sql.raw(`SELECT id, jd_url, interview_notes_url, additional_docs_url FROM mandates LIMIT 5`));
    console.log("mandates:", mandates);
  } catch (e: any) {
    console.error(e.message);
  }
  process.exit(0);
}

checkFiles();
