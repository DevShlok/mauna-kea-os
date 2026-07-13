import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const connection = postgres(dbUrl, { prepare: false });
const db = drizzle(connection);

async function createBucket() {
  console.log("Attempting to create Supabase storage bucket 'mauna-kea-documents'...");
  try {
    await db.execute(sql.raw(`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        'mauna-kea-documents',
        'mauna-kea-documents',
        true,
        52428800, -- 50MB
        '{ "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation" }'
      )
      ON CONFLICT (id) DO UPDATE SET public = true;
    `));
    
    // Create RLS policies for the public bucket
    await db.execute(sql.raw(`
      CREATE POLICY IF NOT EXISTS "Public Access" 
      ON storage.objects FOR SELECT 
      USING ( bucket_id = 'mauna-kea-documents' );
      
      CREATE POLICY IF NOT EXISTS "Public Insert" 
      ON storage.objects FOR INSERT 
      WITH CHECK ( bucket_id = 'mauna-kea-documents' );
    `));
    
    console.log("✅ Successfully created bucket and RLS policies!");
  } catch (e: any) {
    console.error("❌ Failed to create bucket:", e.message);
  }
  process.exit(0);
}

createBucket();
