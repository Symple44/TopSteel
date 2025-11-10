// Nuclear option: Drop and recreate entire public schema
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || '192.168.0.22',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'toptime',
  password: process.env.DB_PASSWORD || 'toptime',
  database: process.env.DB_AUTH_NAME || 'topsteel_auth',
});

async function nukeSchema() {
  try {
    console.log('\n💣 NUCLEAR OPTION: Dropping entire public schema...');
    console.log(`   Database: ${process.env.DB_AUTH_NAME || 'topsteel_auth'}`);
    console.log('   ⚠️  This will delete EVERYTHING in the public schema!\n');

    // Drop the entire public schema
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
    console.log('✅ Dropped public schema');

    // Recreate the public schema
    await pool.query('CREATE SCHEMA public');
    console.log('✅ Created fresh public schema');

    // Grant permissions
    await pool.query('GRANT ALL ON SCHEMA public TO toptime');
    await pool.query('GRANT ALL ON SCHEMA public TO public');
    console.log('✅ Granted permissions');

    console.log('\n✅ Schema completely reset - ready for fresh migrations');
    console.log('\n💡 Now run: cd apps/api && pnpm migration:auth:run\n');

    await pool.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

nukeSchema();
