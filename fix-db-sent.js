require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false });
  try {
    await sql`UPDATE mandate_candidates SET is_sent_to_client = true WHERE is_sent_to_client = false OR is_sent_to_client IS NULL;`;
    console.log("Updated existing mandate_candidates to true");
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
}
main();
