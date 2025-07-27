const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function createTable() {
  // First try to connect to the AUTH database
  let pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'topsteel_auth'
  });

  try {
    console.log('🔄 Trying to connect to topsteel_auth database...');
    await pool.query('SELECT 1');
    console.log('✅ Connected to topsteel_auth');
  } catch (error) {
    console.log('❌ topsteel_auth database does not exist, trying to create it...');
    
    // Connect to postgres database to create topsteel_auth
    const adminPool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres'
    });
    
    try {
      await adminPool.query('CREATE DATABASE topsteel_auth OWNER postgres');
      console.log('✅ topsteel_auth database created');
      await adminPool.end();
      
      // Now reconnect to the new database
      pool = new Pool({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        database: 'topsteel_auth'
      });
    } catch (createError) {
      console.log('ℹ️  Database may already exist, continuing...');
      await adminPool.end();
    }
  }

  try {
    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'create-user-menu-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🔄 Creating user_menu_preference_items table...');
    await pool.query(sql);
    console.log('✅ Table created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
  } finally {
    await pool.end();
  }
}

createTable();