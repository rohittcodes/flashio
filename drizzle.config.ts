import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load environment variables
config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});