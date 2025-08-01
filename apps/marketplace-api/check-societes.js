const { Client } = require('pg');

async function checkSocietes() {
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
    
    // Check if societes table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'societes'
      );
    `);
    
    console.log('Societes table exists:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Get all societes
      const result = await client.query('SELECT code, nom, id, configuration FROM societes LIMIT 10');
      console.log('Societes found:', result.rows.length);
      console.log('Societes:', JSON.stringify(result.rows, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSocietes();