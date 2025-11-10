const { Client } = require('pg');

async function checkSchema() {
  const client = new Client({
    host: '192.168.0.22',
    port: 5432,
    user: 'topsteel',
    password: 'topsteel',
    database: 'topsteel_auth'
  });

  try {
    await client.connect();
    console.log('Connected to topsteel_auth\n');

    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'menu_configurations'
      )
    `);

    console.log('Table menu_configurations exists:', tableCheck.rows[0].exists);

    if (tableCheck.rows[0].exists) {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'menu_configurations'
        ORDER BY ordinal_position
      `);

      console.log('\nColumns in menu_configurations:');
      result.rows.forEach(row => {
        const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`  - ${row.column_name} (${row.data_type}) ${nullable}`);
      });
    } else {
      console.log('\nTable menu_configurations does not exist');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
