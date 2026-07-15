import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
  const tables = ['clients', 'mandates', 'candidates', 'floats', 'platform_users', 'frameworks'];
  for (const table of tables) {
    try {
      await db.execute(sql.raw(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;`));
      await db.execute(sql.raw(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`));
      await db.execute(sql.raw(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);`));
      console.log(`Added columns to ${table}`);
    } catch (e) {
      console.error(`Failed for ${table}`, e);
    }
  }
  process.exit(0);
}
main();
