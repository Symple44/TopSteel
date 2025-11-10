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
    console.log('✅ Connected to topsteel_auth\n');

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_societe_roles'
      ORDER BY ordinal_position
    `);

    console.log('Colonnes de la table user_societe_roles:');
    result.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Check specifically for deleted_at
    const hasDeletedAt = result.rows.some(r => r.column_name === 'deleted_at');
    console.log(`\n❓ La colonne 'deleted_at' existe: ${hasDeletedAt ? '✅ OUI' : '❌ NON'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
