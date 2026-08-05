import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL as string, { ssl: 'require' });

async function main() {
  try {
    const result = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'candidates';
    `;
    console.log("Columns in database:", result.map(r => r.column_name).join(', '));
  } catch (e) {
    console.log("Error:", e);
  }
  process.exit(0);
}

main();
