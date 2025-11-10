// Check both potential auth databases
const { Pool } = require('pg');

async function checkDatabase(dbName) {
  const pool = new Pool({
    host: '192.168.0.22',
    port: 5432,
    user: 'toptime',
    password: 'toptime',
    database: dbName,
  });

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Checking database: ${dbName}`);
    console.log('='.repeat(60));

    // Check connection
    const versionResult = await pool.query('SELECT version()');
    console.log('✅ Connection successful');

    // List all user tables
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 0) {
      console.log('❌ No tables found in public schema');
    } else {
      console.log(`\n📋 Tables found (${tablesResult.rows.length}):`);
      tablesResult.rows.forEach(t => {
        console.log(`   - ${t.table_name}`);
      });
    }

    // Check for users
    try {
      const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
      console.log(`\n👥 Users: ${usersResult.rows[0].count} user(s) found`);
    } catch (err) {
      console.log('\n👥 Users: Table does not exist');
    }

    // Check for migrations
    try {
      const migrationsResult = await pool.query('SELECT COUNT(*) as count FROM migrations');
      console.log(`📦 Migrations: ${migrationsResult.rows[0].count} migration(s) recorded`);
    } catch (err) {
      console.log('📦 Migrations: Table does not exist');
    }

    await pool.end();
  } catch (error) {
    console.log(`\n❌ Error connecting to ${dbName}:`, error.message);
  }
}

async function main() {
  await checkDatabase('topsteel_auth');
  await checkDatabase('erp_topsteel_auth');
  console.log('\n' + '='.repeat(60) + '\n');
}

main();
