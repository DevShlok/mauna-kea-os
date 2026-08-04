import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

async function runMigration() {
  console.log('Running Phase 2 database migration...');
  const rawUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
  if (!rawUrl) {
    throw new Error('DATABASE_URL is missing in environment');
  }
  const dbUrl = rawUrl.split('?')[0];
  const sql = postgres(dbUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS reference_checks (
      id SERIAL PRIMARY KEY,
      cand_id VARCHAR(50) NOT NULL REFERENCES candidates(id),
      conducted_by VARCHAR(255),
      referee_name VARCHAR(255),
      referee_relationship VARCHAR(100),
      referee_company VARCHAR(255),
      status VARCHAR(50) DEFAULT 'In Progress',
      responses JSON DEFAULT '{}',
      summary_positives TEXT,
      summary_improvements TEXT,
      summary_neutral TEXT,
      is_shared_with_client BOOLEAN DEFAULT false,
      is_verified BOOLEAN DEFAULT false,
      verified_at TIMESTAMP,
      verified_by VARCHAR(255),
      created_at TIMESTAMP DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS candidate_verifications (
      id SERIAL PRIMARY KEY,
      cand_id VARCHAR(50) UNIQUE NOT NULL REFERENCES candidates(id),
      status VARCHAR(50) DEFAULT 'Not Started',
      badge_level VARCHAR(50) DEFAULT 'none',
      verified_at TIMESTAMP,
      verified_by VARCHAR(255),
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS rc_cand_id_idx ON reference_checks(cand_id);`;
  await sql`CREATE INDEX IF NOT EXISTS rc_status_idx ON reference_checks(status);`;
  await sql`CREATE INDEX IF NOT EXISTS cv_cand_id_idx ON candidate_verifications(cand_id);`;

  console.log('Phase 2 migration completed successfully.');
  process.exit(0);
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
