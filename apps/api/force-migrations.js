// Force reset and run migrations
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || '192.168.0.22',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'toptime',
  password: process.env.DB_PASSWORD || 'toptime',
  database: process.env.DB_AUTH_NAME || 'topsteel_auth',
});

async function resetMigrations() {
  try {
    console.log('\n🔄 Force resetting migrations...');
    console.log(`   Database: ${process.env.DB_AUTH_NAME || 'topsteel_auth'}`);

    // Drop migrations table if it exists
    await pool.query('DROP TABLE IF EXISTS migrations CASCADE');
    console.log('✅ Dropped existing migrations table (if any)');

    // Drop any existing tables that might interfere
    const tables = ['user_sessions', 'user_societe_roles', 'roles', 'societes', 'users', 'sites', 'shared_data_registry', 'societe_users'];
    for (const table of tables) {
      try {
        await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (err) {
        // Ignore errors - table might not exist
      }
    }

    // Drop all indexes in public schema
    try {
      const indexesResult = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname NOT LIKE 'pg_%'
      `);

      for (const row of indexesResult.rows) {
        try {
          await pool.query(`DROP INDEX IF EXISTS ${row.indexname} CASCADE`);
          console.log(`✅ Dropped index: ${row.indexname}`);
        } catch (err) {
          // Ignore errors
        }
      }
    } catch (err) {
      // Ignore errors
    }

    // Drop all enum types
    try {
      const enumsResult = await pool.query(`
        SELECT t.typname
        FROM pg_type t
        INNER JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        AND t.typtype = 'e'
      `);

      for (const row of enumsResult.rows) {
        try {
          await pool.query(`DROP TYPE IF EXISTS ${row.typname} CASCADE`);
          console.log(`✅ Dropped enum: ${row.typname}`);
        } catch (err) {
          // Ignore errors
        }
      }
    } catch (err) {
      // Ignore errors
    }

    console.log('\n✅ Database reset complete - ready for fresh migrations');
    console.log('\n💡 Now run: cd apps/api && pnpm migration:auth:run\n');

    await pool.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

resetMigrations();
