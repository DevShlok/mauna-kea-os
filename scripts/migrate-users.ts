import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { platformUsers } from '../src/db/schema';
import path from 'path';

// Load .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrate() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Missing DATABASE_URL in .env.local');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const sql = postgres(connectionString);
  const db = drizzle(sql);

  console.log('Fetching users from platform_users...');
  const users = await db.select().from(platformUsers);
  
  console.log(`Found ${users.length} users. Starting migration to Supabase Auth...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const user of users) {
    console.log(`Processing: ${user.email}`);
    
    // Create the user via Supabase Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      email_confirm: true, // Auto-confirm their email so they can log in
      password: 'TemporaryPassword123!', // Provide a generic password
      user_metadata: {
        full_name: user.name,
        role: user.role,
      }
    });

    if (error) {
      if (error.message.includes('already exists') || error.message.includes('already registered')) {
        console.log(`⚠️  Skipped (Already exists): ${user.email}`);
      } else {
        console.error(`❌ Failed to create ${user.email}:`, error.message);
        failCount++;
      }
    } else {
      console.log(`✅ Successfully migrated: ${user.email}`);
      successCount++;
    }
  }

  console.log('\n=====================================');
  console.log(`Migration Complete!`);
  console.log(`Successfully migrated: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('=====================================');
  console.log('Note: The migrated users will have the password "TemporaryPassword123!".');
  console.log('Since you use Google OAuth, they can also simply "Continue with Google" without a password.');
  
  process.exit(0);
}

migrate();
