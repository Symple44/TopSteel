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

    // Vérifier la colonne deleted_at dans users
    const usersResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('=== Table users ===');
    console.log('Colonnes:');
    usersResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    const hasDeletedAt = usersResult.rows.some(row => row.column_name === 'deleted_at');
    console.log(`\n✅ deleted_at exists: ${hasDeletedAt}\n`);

    // Vérifier si la table system_parameters existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'system_parameters'
      )
    `);

    console.log('=== Table system_parameters ===');
    console.log(`Exists: ${tableCheck.rows[0].exists}`);

    if (tableCheck.rows[0].exists) {
      const columnsResult = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'system_parameters'
        ORDER BY ordinal_position
      `);
      console.log('Colonnes:');
      columnsResult.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type})`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
