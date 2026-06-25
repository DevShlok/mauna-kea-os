import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import dns from 'dns';

// Force IPv4 resolution first to prevent 1.7s timeout delays per connection attempt
dns.setDefaultResultOrder('ipv4first');

// Singleton pool to avoid creating multiple connections in dev hot-reload
const globalForDb = globalThis as unknown as { pool?: mysql.Pool };

const dbUrl = process.env.DATABASE_URL?.split('?')[0];

const pool = globalForDb.pool ?? mysql.createPool({
  uri: dbUrl,
  connectionLimit: 10,
  waitForConnections: true,
  ssl: {
    rejectUnauthorized: false
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema, mode: 'default' });
