require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false });
  
  try {
    await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS dob date;`;
    await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS hometown varchar(100);`;
    await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS stability jsonb DEFAULT '{}'::jsonb;`;
    await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS relocation_status varchar(50);`;
    await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS relocation_prefs jsonb DEFAULT '[]'::jsonb;`;
    console.log("Added new columns to candidates table");
  } catch (err) {
    console.error("Error adding columns:", err.message);
  }

  // Update schema.ts
  let schema = fs.readFileSync('src/db/schema.ts', 'utf8');
  if (!schema.includes("dob: date('dob')")) {
    schema = schema.replace(
      "deletedBy: varchar('deleted_by', { length: 255 }),",
      "dob: date('dob'),\n  hometown: varchar('hometown', { length: 100 }),\n  stability: json('stability').$type<{ current: string; previous: string }>(),\n  relocationStatus: varchar('relocation_status', { length: 50 }),\n  relocationPrefs: json('relocation_prefs').$type<string[]>(),\n  deletedBy: varchar('deleted_by', { length: 255 }),"
    );
    fs.writeFileSync('src/db/schema.ts', schema);
    console.log("Updated schema.ts");
  }
  
  process.exit(0);
}
main();
