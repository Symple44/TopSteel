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
    console.log('✅ Connecté à topsteel_auth\n');

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'societes'
      ORDER BY ordinal_position
    `);

    console.log('=== Table societes ===');
    console.log('Colonnes:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
