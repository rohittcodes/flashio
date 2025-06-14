import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

// Validate DATABASE_URL
if (!process.env.DATABASE_URL?.startsWith('postgres://')) {
  throw new Error('Invalid or missing DATABASE_URL. Must start with postgres://');
}

async function main() {
  try {
    console.log('Starting migration...');
    
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);

    console.log('Connecting to database...');
    
    // Run migrations
    await migrate(db, {
      migrationsFolder: join(__dirname, '..', 'src', 'db', 'migrations'),
      migrationsTable: 'drizzle_migrations',
    });

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}
