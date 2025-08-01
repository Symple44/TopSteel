const { Client } = require('pg');

async function checkERPDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres' // Connect to default postgres db to check others
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // List all databases
    const result = await client.query(`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false 
      ORDER BY datname
    `);
    
    console.log('Available databases:');
    result.rows.forEach(db => {
      const dbName = db.datname;
      if (dbName.includes('topsteel')) {
        console.log(`  ✅ ${dbName}`);
      } else {
        console.log(`  • ${dbName}`);
      }
    });

    // Check specifically for erp_topsteel_topsteel
    const target = 'erp_topsteel_topsteel';
    const exists = result.rows.some(db => db.datname === target);
    console.log(`\n🎯 Target database "${target}": ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkERPDatabase();