// List all tables in the auth database
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || '192.168.0.22',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'toptime',
  password: process.env.DB_PASSWORD || 'toptime',
  database: process.env.DB_AUTH_NAME || 'topsteel_auth',
});

async function listTables() {
  try {
    console.log('\n📋 All tables in topsteel_auth database:\n');

    const result = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log(`Total tables: ${result.rows.length}\n`);
    result.rows.forEach((row, index) => {
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${row.tablename}`);
    });

    console.log('\n');
    await pool.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

listTables();
