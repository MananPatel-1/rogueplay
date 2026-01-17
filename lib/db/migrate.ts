import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function runMigrations() {
  console.log('⏳ Running migrations...');

  const databaseUrl = process.env.POSTGRES_URL;

  if (!databaseUrl) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }

  const connection = postgres(databaseUrl, { max: 1 });
  const db = drizzle(connection);

  try {
    await migrate(db, { migrationsFolder: './lib/db/migrations' });
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }

  // Run seed script
  console.log('⏳ Running seed script...');
  try {
    await execAsync('npx tsx lib/db/seed.ts');
    console.log('✅ Seed completed successfully');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    // Don't throw - seeds might fail if data already exists
    console.log('⚠️ Continuing despite seed errors (this is normal if data already exists)');
  }
}

runMigrations().catch((error) => {
  console.error(error);
  process.exit(1);
});
