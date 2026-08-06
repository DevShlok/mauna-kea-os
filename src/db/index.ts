import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const globalForDb = globalThis as unknown as { postgresConnection?: ReturnType<typeof postgres> };

const rawUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

const connection = globalForDb.postgresConnection ?? postgres(rawUrl, { 
  prepare: false, 
  ssl: 'require',
  connect_timeout: 30,
  idle_timeout: 20,
  max: process.env.NODE_ENV === 'development' ? 10 : 20 
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.postgresConnection = connection;
}

export const db = drizzle(connection, { schema });
