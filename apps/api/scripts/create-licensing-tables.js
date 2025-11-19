/**
 * Script to create Licensing tables in PostgreSQL
 * Uses pg library to execute SQL directly
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function createLicensingTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://topsteel:topsteel@192.168.0.22:5432/topsteel',
  });

  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read SQL file
    const sqlPath = path.join(__dirname, '../prisma/licensing_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('\n📄 Executing SQL script...');
    console.log('   File: licensing_tables.sql');
    console.log('   Size:', sql.length, 'bytes\n');

    // Execute SQL
    await client.query(sql);

    console.log('\n✅ Licensing tables created successfully!\n');

  } catch (error) {
    console.error('\n❌ Error creating tables:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('📡 Database connection closed\n');
  }
}

// Run script
createLicensingTables()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
