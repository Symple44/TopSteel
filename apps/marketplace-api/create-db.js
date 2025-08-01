const { Client } = require('pg');

async function createDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres' // Connect to default postgres db to create new one
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'erp_topsteel_marketplace'"
    );
    
    if (result.rowCount === 0) {
      await client.query('CREATE DATABASE erp_topsteel_marketplace');
      console.log('✅ Database erp_topsteel_marketplace created successfully');
    } else {
      console.log('ℹ️ Database erp_topsteel_marketplace already exists');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createDatabase();