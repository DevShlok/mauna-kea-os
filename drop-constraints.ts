import postgres from "postgres";

const connectionString = "postgres://postgres.vzsvuakvrnqodozyjpfr:*Krishna%401469*@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require";
const sql = postgres(connectionString);

async function run() {
  try {
    const res = await sql`SELECT count(*) FROM master_locations`;
    console.log("Locations count:", res[0].count);
  } catch (e: any) { console.error("Error:", e.message); }

  console.log("Done!");
  process.exit(0);
}

run();
