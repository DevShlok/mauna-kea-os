const { Pool } = require("pg");
const connectionString = "postgres://postgres.vzsvuakvrnqodozyjpfr:*Krishna%401469*@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require";
const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const tables = ['clients', 'mandates', 'candidates', 'floats', 'platform_users', 'frameworks'];
  for (const table of tables) {
    try {
      await pool.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;`);
      await pool.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`);
      await pool.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);`);
      console.log(`Added columns to ${table}`);
    } catch (e) {
      console.error(`Failed for ${table}`, e);
    }
  }
  process.exit(0);
}
main();
