import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const connection = postgres(dbUrl, { prepare: false });
const db = drizzle(connection);

db.execute(sql.raw(`
  UPDATE storage.buckets 
  SET allowed_mime_types = '{ "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "image/jpeg", "image/png", "image/gif", "image/webp" }' 
  WHERE id = 'mauna-kea-documents';
`)).then(() => process.exit(0));
