import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
const pgSql = postgres(process.env.DATABASE_URL!);
const db = drizzle(pgSql);
db.execute(sql`SELECT 1 as num`).then(console.log).then(() => process.exit(0));
