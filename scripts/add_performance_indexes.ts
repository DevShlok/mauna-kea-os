import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is not set");

  const queryClient = postgres(dbUrl.split('?')[0]);
  const db = drizzle(queryClient);

  console.log("Enabling pg_trgm extension if not exists...");
  await queryClient`CREATE EXTENSION IF NOT EXISTS pg_trgm;`;

  console.log("Creating trigram index on candidates.company...");
  await queryClient`CREATE INDEX IF NOT EXISTS candidates_company_trgm_idx ON candidates USING gin (company gin_trgm_ops);`;

  console.log("Creating trigram index on candidates.past_companies...");
  // cast past_companies (which is jsonb or text) to text for indexing
  await queryClient`CREATE INDEX IF NOT EXISTS candidates_past_companies_trgm_idx ON candidates USING gin ((past_companies::text) gin_trgm_ops);`;

  console.log("Creating composite index on candidates for filtering...");
  await queryClient`CREATE INDEX IF NOT EXISTS candidates_status_is_deleted_idx ON candidates (status, is_deleted);`;

  console.log("Done.");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
