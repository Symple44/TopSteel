const { Client } = require('pg');

async function checkConstraints() {
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

    // Check table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'parameters_system'
      )
    `);

    console.log('Table parameters_system exists:', tableCheck.rows[0].exists);

    if (tableCheck.rows[0].exists) {
      // Check constraints
      const constraints = await client.query(`
        SELECT conname, contype, pg_get_constraintdef(oid) as definition
        FROM pg_constraint
        WHERE conrelid = 'parameters_system'::regclass
      `);

      console.log('\nContraintes sur parameters_system:');
      constraints.rows.forEach(row => {
        console.log(`  - ${row.conname} (${row.contype}): ${row.definition}`);
      });

      // Check indexes
      const indexes = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'parameters_system'
      `);

      console.log('\nIndex sur parameters_system:');
      indexes.rows.forEach(row => {
        console.log(`  - ${row.indexname}: ${row.indexdef}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

checkConstraints();
