import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL as string, { ssl: 'require' });

async function main() {
  try {
    console.log("Creating candidate_jobs...");
    await sql`
      CREATE TABLE IF NOT EXISTS candidate_jobs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        company_display VARCHAR(255),
        is_confidential BOOLEAN DEFAULT false,
        location VARCHAR(255),
        ctc_range_min INTEGER,
        ctc_range_max INTEGER,
        experience_min INTEGER,
        experience_max INTEGER,
        sector VARCHAR(255),
        description TEXT,
        highlights JSON DEFAULT '[]'::json,
        is_active BOOLEAN DEFAULT true,
        target_cand_ids JSON DEFAULT '[]'::json,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT now(),
        expires_at TIMESTAMP
      );`;
    await sql`CREATE INDEX IF NOT EXISTS cj_is_active_idx ON candidate_jobs(is_active);`;
    await sql`CREATE INDEX IF NOT EXISTS cj_sector_idx ON candidate_jobs(sector);`;
  } catch (e) {
    console.log("Error creating candidate_jobs:", e);
  }

  try {
    console.log("Creating candidate_job_interests...");
    await sql`
      CREATE TABLE IF NOT EXISTS candidate_job_interests (
        id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL REFERENCES candidate_jobs(id) ON DELETE CASCADE,
        cand_id VARCHAR(50) NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'Shown',
        created_at TIMESTAMP DEFAULT now(),
        CONSTRAINT cji_job_cand_unique UNIQUE (job_id, cand_id)
      );`;
    await sql`CREATE INDEX IF NOT EXISTS cji_cand_id_idx ON candidate_job_interests(cand_id);`;
  } catch (e) {
    console.log("Error creating candidate_job_interests:", e);
  }

  try {
    console.log("Creating dream_company_status...");
    await sql`
      CREATE TABLE IF NOT EXISTS dream_company_status (
        id SERIAL PRIMARY KEY,
        cand_id VARCHAR(50) NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'Not Started',
        notes TEXT,
        updated_by VARCHAR(255),
        updated_at TIMESTAMP DEFAULT now(),
        created_at TIMESTAMP DEFAULT now()
      );`;
    await sql`CREATE INDEX IF NOT EXISTS dcs_cand_id_idx ON dream_company_status(cand_id);`;
  } catch (e) {
    console.log("Error creating dream_company_status:", e);
  }

  try {
    console.log("Creating candidate_applications...");
    await sql`
      CREATE TABLE IF NOT EXISTS candidate_applications (
        id SERIAL PRIMARY KEY,
        cand_id VARCHAR(50) NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        source VARCHAR(50) DEFAULT 'direct',
        job_id INTEGER REFERENCES candidate_jobs(id) ON DELETE SET NULL,
        mandate_id INTEGER REFERENCES mandates(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'Profile Submitted',
        applied_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );`;
    await sql`CREATE INDEX IF NOT EXISTS ca_cand_id_idx ON candidate_applications(cand_id);`;
  } catch (e) {
    console.log("Error creating candidate_applications:", e);
  }

  console.log("Done.");
  process.exit(0);
}

main();
