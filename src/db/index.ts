import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// Singleton pool to avoid creating multiple connections in dev hot-reload
const globalForDb = globalThis as unknown as { pool?: mysql.Pool };

const pool = globalForDb.pool ?? mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Krishna@1469*',
  database: 'maunakea',
  connectionLimit: 10,
  waitForConnections: true,
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema, mode: 'default' });
export type DB = typeof db;
