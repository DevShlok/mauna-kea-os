import postgres from 'postgres';

const oldUrl = 'postgresql://postgres:MaunaKea%401469%2A@db.kpqdprqprknoixhlufwv.supabase.co:5432/postgres';
const newUrl = 'postgres://postgres.vzsvuakvrnqodozyjpfr:do1UCFJiaKfD8s47@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require';

const oldDb = postgres(oldUrl);
const newDb = postgres(newUrl);

const tables = [
  'platform_users', 'frameworks', 'clients', 'candidates', 'mandates',
  'framework_categories', 'framework_criteria', 'mandate_candidates',
  'candidate_files', 'float_references', 'floats', 'float_followups',
  'float_activities', 'candidate_reports', 'time_logs', 'leave_requests',
  'client_notifications', 'client_remarks', 'consultant_notifications'
];

async function migrate() {
  try {
    console.log("Setting replication role to replica...");
    await newDb`SET session_replication_role = 'replica';`;

    for (const table of tables) {
      console.log(`Migrating table: ${table}...`);
      const rows = await oldDb`SELECT * FROM ${oldDb(table)}`;
      if (rows.length > 0) {
        console.log(`Found ${rows.length} rows, inserting...`);
        // We do batch inserts of 1000
        for (let i = 0; i < rows.length; i += 1000) {
          const batch = rows.slice(i, i + 1000);
          await newDb`INSERT INTO ${newDb(table)} ${newDb(batch)}`;
        }
      } else {
        console.log("0 rows found.");
      }
    }
    
    console.log("Fixing sequences...");
    const serialTables = ['mandates', 'mandate_candidates', 'candidate_files', 'float_references', 'float_activities', 'framework_categories', 'framework_criteria', 'client_notifications', 'client_remarks', 'consultant_notifications', 'time_logs', 'leave_requests'];
    
    for (const table of serialTables) {
      try {
        await newDb`SELECT setval(pg_get_serial_sequence(${table}, 'id'), COALESCE((SELECT MAX(id) FROM ${newDb(table)}), 1) + 1)`;
      } catch (e) {
         // ignore
      }
    }

    console.log("Restoring replication role...");
    await newDb`SET session_replication_role = 'origin';`;
    
    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await oldDb.end();
    await newDb.end();
  }
}

migrate();
