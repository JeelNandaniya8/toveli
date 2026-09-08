import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;
let database: Database | undefined;

export function getDb() {
  if (database) return database;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required.');
  const client = postgres(url, { max: 10, prepare: false });
  database = drizzle(client, { schema });
  return database;
}
