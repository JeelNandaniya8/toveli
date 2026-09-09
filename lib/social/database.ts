import postgres from 'postgres';
import type { Database, Queryable, Row } from './service.ts';

let database: Database | undefined;
export function socialDatabase(): Database {
  if (database) return database;
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  const client = postgres(process.env.DATABASE_URL, { max: 5, prepare: false });
  const adapt = (sql: Pick<typeof client, 'unsafe'>): Queryable => ({
    async query<T extends Row>(text: string, params: unknown[] = []) {
      const rows = await sql.unsafe(text, params as never[]);
      return { rows: Array.from(rows) as unknown as T[] };
    },
  });
  database = { ...adapt(client), transaction: run => client.begin(tx => run(adapt(tx as unknown as typeof client))) as Promise<never> };
  return database;
}
