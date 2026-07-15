require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false });
  
  try {
    await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT CURRENT_TIMESTAMP;`;
    console.log("Added updated_at to candidates");
  } catch (err) {
    console.error("Error adding column:", err.message);
  }

  // Update schema.ts
  let schema = fs.readFileSync('src/db/schema.ts', 'utf8');
  if (!schema.includes("updatedAt: datetime('updated_at')")) {
    schema = schema.replace(
      "createdAt: datetime('created_at').default(sql`now()`),",
      "createdAt: datetime('created_at').default(sql`now()`)," + "\n  updatedAt: datetime('updated_at').default(sql`now()`),"
    );
    fs.writeFileSync('src/db/schema.ts', schema);
    console.log("Updated schema.ts");
  }
  
  process.exit(0);
}
main();
