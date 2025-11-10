// List all databases on the PostgreSQL server
const { Pool } = require('pg');

const pool = new Pool({
  host: '192.168.0.22',
  port: 5432,
  user: 'toptime',
  password: 'toptime',
  database: 'postgres', // Connect to postgres database to list all databases
});

async function listDatabases() {
  try {
    console.log('\n📊 Listing all databases on server 192.168.0.22:\n');

    const result = await pool.query(`
      SELECT datname, pg_size_pretty(pg_database_size(datname)) as size
      FROM pg_database
      WHERE datistemplate = false
      ORDER BY datname
    `);

    result.rows.forEach(db => {
      console.log(`   - ${db.datname} (${db.size})`);
    });

    console.log('\n');
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listDatabases();
