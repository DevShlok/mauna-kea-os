const mysql = require('mysql2/promise');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

// The tables in strict foreign-key order
const TABLES = [
  'platform_users',
  'frameworks',
  'framework_categories',
  'framework_criteria',
  'candidates',
  'clients',
  'mandates',
  'mandate_candidates',
  'candidate_files',
  'candidate_reports',
  'floats',
  'float_references',
  'float_followups',
  'float_activities',
  'client_notifications',
  'client_remarks',
  'consultant_notifications',
  'time_logs',
  'leave_requests'
];

async function migrate() {
  const mysqlUri = 'mysql://avnadmin:REDACTED@mysql-16ca8a72-shlokshukla1469-00a5.d.aivencloud.com:17622/defaultdb';
  const pgUri = process.env.DATABASE_URL;

  console.log('Connecting to MySQL (Aiven)...');
  const mysqlConn = await mysql.createConnection({
    uri: mysqlUri,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to PostgreSQL (Supabase)...');
  const pgConn = postgres(pgUri, { prepare: false });

  for (const table of TABLES) {
    console.log(`\n--- Migrating ${table} ---`);
    const [rows] = await mysqlConn.query(`SELECT * FROM ${table}`);
    console.log(`Found ${rows.length} rows.`);

    if (rows.length > 0) {
      // Clear existing data just in case
      await pgConn.unsafe(`DELETE FROM "${table}"`);
      
      const cols = Object.keys(rows[0]);
      
      for (const row of rows) {
        // Convert MySQL JSON/Buffer objects if necessary
        const values = cols.map(col => {
          let val = row[col];
          if (val && typeof val === 'object' && !(val instanceof Date)) {
            val = JSON.stringify(val);
          }
          return val;
        });

        // Create the INSERT statement
        const colNames = cols.map(c => `"${c}"`).join(', ');
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders})`;
        
        try {
          await pgConn.unsafe(query, values);
        } catch (e) {
          console.error(`Failed to insert row in ${table}:`, e.message);
        }
      }
      console.log(`Successfully inserted ${rows.length} rows into ${table}.`);

      // Update the sequence for this table if it has an integer 'id'
      if (typeof rows[0].id === 'number') {
        try {
          const res = await pgConn.unsafe(`SELECT setval('"${table}_id_seq"', (SELECT MAX(id) FROM "${table}"))`);
          console.log(`Updated sequence for ${table} to ${res[0]?.setval || 'N/A'}`);
        } catch (e) {
          // If no sequence exists, ignore
        }
      }
    } else {
      console.log(`Skipped ${table} (Empty)`);
    }
  }

  console.log('\nMigration Complete!');
  await mysqlConn.end();
  await pgConn.end();
}

migrate().catch(console.error);
