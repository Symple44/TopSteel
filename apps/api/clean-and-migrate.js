const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_AUTH_NAME,
});

async function cleanAndMigrate() {
  try {
    console.log('\n🧹 Cleaning database...');
    
    // Drop all tables
    await pool.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO ${process.env.DB_USERNAME};
      GRANT ALL ON SCHEMA public TO public;
    `);
    
    console.log('✅ Database cleaned');
    await pool.end();
    
    console.log('\n🔄 Now run: pnpm migration:auth:run\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanAndMigrate();
