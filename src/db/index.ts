import { drizzle } from 'drizzle-orm/neon-http';
import { neon, NeonHttpDatabase } from '@neondatabase/serverless';
import * as schema from './schema';

// Ensure required environment variables are set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

let _db: NeonHttpDatabase | null = null;

// Configure database connection with error handling
function getConnection() {
  if (!_db) {
    try {
      const sql = neon(process.env.DATABASE_URL!);
      _db = drizzle(sql, { 
        schema,
        logger: process.env.NODE_ENV === 'development',
      });
    } catch (error) {
      console.error('Failed to create database connection:', error);
      throw error;
    }
  }
  return _db;
}

// Initialize Drizzle with our schema
export const db = drizzle(sql, { 
  schema,
  logger: process.env.NODE_ENV === 'development',
});

// Export everything from schema
export * from './schema';

// Export a function to test the database connection
export async function testConnection() {
  try {
    // Try a simple query
    await db.select().from(schema.users).limit(1);
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
