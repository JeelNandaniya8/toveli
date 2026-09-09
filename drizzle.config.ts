import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { defineConfig } from "drizzle-kit";

// Match Next.js local setup while keeping Render-injected environment values.
for (const file of ['.env.local', '.env']) if (existsSync(file)) loadEnvFile(file);

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: process.env.DATABASE_URL ? { url: process.env.DATABASE_URL } : undefined,
});
