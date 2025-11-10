// Check user_sessions table schema
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || '192.168.0.22',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'toptime',
  password: process.env.DB_PASSWORD || 'toptime',
  database: process.env.DB_AUTH_NAME || 'topsteel_auth',
});

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'user_sessions'
      ORDER BY ordinal_position
    `);

    console.log('\nuser_sessions table columns:\n');
    result.rows.forEach(row => {
      const maxLen = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
      console.log(`  ${row.column_name}: ${row.data_type}${maxLen}`);
    });
    console.log('');

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
