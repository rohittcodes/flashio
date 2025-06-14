import { config } from 'dotenv';
import { testConnection } from '../src/db';

// Load environment variables from .env file
config();

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'AUTH_GITHUB_ID',
  'AUTH_GITHUB_SECRET',
  'AUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET'
];

function validateEnv() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    return false;
  }
  return true;
}

async function main() {
  console.log('Checking environment variables...');
  if (!validateEnv()) {
    process.exit(1);
  }
  console.log('Environment variables validated successfully.');
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Failed to test database connection:', error);
    process.exit(1);
  }
}

main();
