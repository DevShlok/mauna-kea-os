import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Starting manual migration for engagement lists...");
  try {
    await db.execute(sql`DROP TABLE IF EXISTS bd_list_items CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS calling_list_items CASCADE`);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS engagement_list_items (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(10) NOT NULL REFERENCES platform_users(id),
        cand_id VARCHAR(20) NOT NULL REFERENCES candidates(id),
        list_type VARCHAR(20) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        next_follow_up DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT now()
      )
    `);
    
    await db.execute(sql`CREATE INDEX IF NOT EXISTS el_user_id_idx ON engagement_list_items (user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS el_cand_id_idx ON engagement_list_items (cand_id)`);

    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  }
  process.exit(0);
}

main();
