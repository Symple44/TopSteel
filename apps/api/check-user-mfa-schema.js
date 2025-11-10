// Check user_mfa table schema
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
    console.log('\n📋 Checking user_mfa table schema...\n');

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'user_mfa'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table user_mfa does not exist!\n');
      await pool.end();
      return;
    }

    console.log('✅ Table user_mfa exists');

    // Get column details
    const columns = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_mfa'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Columns:');
    columns.rows.forEach(col => {
      const maxLen = col.character_maximum_length ? ` (${col.character_maximum_length})` : '';
      console.log(`   - ${col.column_name}: ${col.data_type}${maxLen} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });

    console.log('\n');
    await pool.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
