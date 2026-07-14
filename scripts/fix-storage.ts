import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("Creating permissive RLS policies for Supabase storage...");
    
    // We create policies on storage.objects to allow everything for everyone
    await db.execute(sql`
      -- Policy for INSERT (Upload)
      CREATE POLICY "Allow public uploads to storage" 
      ON storage.objects FOR INSERT TO public 
      WITH CHECK ( bucket_id = 'mauna-kea-documents' );
      
      -- Policy for SELECT (Read)
      CREATE POLICY "Allow public read from storage" 
      ON storage.objects FOR SELECT TO public 
      USING ( bucket_id = 'mauna-kea-documents' );
      
      -- Policy for UPDATE
      CREATE POLICY "Allow public updates to storage" 
      ON storage.objects FOR UPDATE TO public 
      USING ( bucket_id = 'mauna-kea-documents' );
      
      -- Policy for DELETE
      CREATE POLICY "Allow public deletes from storage" 
      ON storage.objects FOR DELETE TO public 
      USING ( bucket_id = 'mauna-kea-documents' );
    `);

    console.log("Successfully created storage RLS policies!");
    process.exit(0);
  } catch (err) {
    console.error("Error creating policies:", err);
    process.exit(1);
  }
}

run();
