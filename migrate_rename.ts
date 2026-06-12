import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mysql from 'mysql2/promise';

async function run() {
  console.log("Starting zero-data-loss migration...");

  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    
    console.log("Renaming fl_candidates to candidates...");
    await connection.execute(`RENAME TABLE fl_candidates TO candidates;`);
    
    console.log("Renaming fl_submissions to floats...");
    await connection.execute(`RENAME TABLE fl_submissions TO floats;`);
    
    console.log("Renaming fl_followups to float_followups...");
    await connection.execute(`RENAME TABLE fl_followups TO float_followups;`);
    
    console.log("Renaming fl_activities to float_activities...");
    await connection.execute(`RENAME TABLE fl_activities TO float_activities;`);
    
    console.log("Renaming fl_references to float_references...");
    await connection.execute(`RENAME TABLE fl_references TO float_references;`);

    console.log("Migration completed successfully!");
    await connection.end();
  } catch (error) {
    console.error("Migration failed:", error);
  }
  
  process.exit(0);
}

run();
