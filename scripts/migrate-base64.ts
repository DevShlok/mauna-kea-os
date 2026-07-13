import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { candidates } from "@/db/schema";
import { eq } from "drizzle-orm";
dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const connection = postgres(dbUrl, { prepare: false });
const db = drizzle(connection);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! || ""
);

async function migrateBase64() {
  console.log("Starting Base64 migration for profile pictures...");
  try {
    const cands = await db.execute(sql.raw(`SELECT id, profile_pic FROM candidates WHERE profile_pic LIKE 'data:image/%'`));
    console.log(`Found ${cands.length} candidates with base64 profile pictures.`);

    let successCount = 0;
    
    for (const c of cands) {
      try {
        const base64Str = c.profile_pic as string;
        // Parse "data:image/jpeg;base64,..."
        const matches = base64Str.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        
        if (!matches || matches.length !== 3) {
          console.log(`Candidate ${c.id}: Invalid base64 format, skipping.`);
          continue;
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        
        const ext = mimeType.split("/")[1] || "jpeg";
        const filename = `profile-pics/${c.id}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('mauna-kea-documents')
          .upload(filename, buffer, { contentType: mimeType });

        if (uploadError) {
          console.error(`Upload error for ${c.id}:`, uploadError);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from('mauna-kea-documents')
          .getPublicUrl(filename);
          
        const publicUrl = publicUrlData.publicUrl;

        await db.update(candidates)
          .set({ profilePic: publicUrl })
          .where(eq(candidates.id, c.id as string));

        console.log(`✅ Migrated profile picture for candidate ${c.id}`);
        successCount++;
      } catch (err: any) {
        console.error(`Error migrating candidate ${c.id}:`, err.message);
      }
    }
    
    console.log(`Migration complete! Successfully migrated ${successCount} profile pictures.`);
  } catch (e: any) {
    console.error("Migration failed:", e.message);
  }
  process.exit(0);
}

migrateBase64();
