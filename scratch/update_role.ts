import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../src/db/schema';
import { platformUsers } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  try {
    const pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
    });
    const db = drizzle(pool, { schema, mode: 'default' });

    const res = await db.update(platformUsers).set({ role: 'admin' }).where(eq(platformUsers.email, 'shlok.shukla@maunakea.co.in'));
    console.log('Updated:', res);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
