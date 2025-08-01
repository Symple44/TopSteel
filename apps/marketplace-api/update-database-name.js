const { Client } = require('pg');

async function updateDatabaseName() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'erp_topsteel_auth'
  });

  try {
    await client.connect();
    console.log('Connected to auth database');
    
    // Check current societes
    console.log('Current societes:');
    const current = await client.query('SELECT code, nom, "databaseName" FROM societes');
    console.log(current.rows);
    
    // Update TOPSTEEL société to set databaseName
    const result = await client.query(`
      UPDATE societes 
      SET "databaseName" = 'erp_topsteel_topsteel'
      WHERE code = 'TOPSTEEL'
      RETURNING id, code, nom, "databaseName", configuration;
    `);
    
    console.log('✅ Database name updated for TOPSTEEL:', JSON.stringify(result.rows[0], null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

updateDatabaseName();