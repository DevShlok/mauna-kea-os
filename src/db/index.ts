import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const globalForDb = globalThis as unknown as { postgresConnection?: ReturnType<typeof postgres> };

const dbUrl = process.env.DATABASE_URL!;

const connection = globalForDb.postgresConnection ?? postgres(dbUrl, { prepare: false });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.postgresConnection = connection;
}

export const db = drizzle(connection, { schema });
