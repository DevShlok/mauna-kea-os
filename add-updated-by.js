require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false });
  
  try {
    await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS updated_by varchar(255);`;
    console.log("Added updated_by to candidates");
  } catch (err) {
    console.error("Error adding column:", err.message);
  }

  // Update schema.ts
  let schema = fs.readFileSync('src/db/schema.ts', 'utf8');
  if (!schema.includes("updatedBy: varchar('updated_by'")) {
    schema = schema.replace(
      "updatedAt: datetime('updated_at').default(sql`now()`),",
      "updatedAt: datetime('updated_at').default(sql`now()`)," + "\n  updatedBy: varchar('updated_by', { length: 255 }),"
    );
    fs.writeFileSync('src/db/schema.ts', schema);
    console.log("Updated schema.ts");
  }
  
  process.exit(0);
}
main();
