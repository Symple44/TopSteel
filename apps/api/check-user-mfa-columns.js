// Check user_mfa columns
const { Pool } = require('pg');

const pool = new Pool({
  host: '192.168.0.22',
  port: 5432,
  user: 'toptime',
  password: 'toptime',
  database: 'topsteel_auth',
});

async function check() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'user_mfa'
      ORDER BY ordinal_position
    `);

    console.log('\nuser_mfa table columns:\n');
    if (result.rows.length === 0) {
      console.log('Table not found or has no columns\n');
    } else {
      result.rows.forEach(row => {
        const maxLen = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
        console.log(`  ${row.column_name}: ${row.data_type}${maxLen}`);
      });
      console.log('');
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

check();
