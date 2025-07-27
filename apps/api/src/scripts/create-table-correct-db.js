const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function createTableInCorrectDB() {
  // Utiliser la même logique que l'API pour déterminer le nom de la base
  const authDbName = process.env.DB_AUTH_NAME || 'erp_topsteel_auth';
  
  console.log(`🔍 Base de données AUTH configurée: ${authDbName}`);
  
  // First try to connect to the AUTH database
  let pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: authDbName
  });

  try {
    console.log(`🔄 Trying to connect to ${authDbName} database...`);
    await pool.query('SELECT 1');
    console.log(`✅ Connected to ${authDbName}`);
  } catch (error) {
    console.log(`❌ ${authDbName} database does not exist, trying to create it...`);
    
    // Connect to postgres database to create the auth database
    const adminPool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres'
    });
    
    try {
      await adminPool.query(`CREATE DATABASE ${authDbName} OWNER postgres`);
      console.log(`✅ ${authDbName} database created`);
      await adminPool.end();
      
      // Now reconnect to the new database
      pool = new Pool({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        database: authDbName
      });
    } catch (createError) {
      console.log(`ℹ️  Database ${authDbName} may already exist, continuing...`);
      await adminPool.end();
    }
  }

  try {
    // Check if table already exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_menu_preference_items'
      );
    `);
    
    if (checkResult.rows[0].exists) {
      console.log(`✅ Table user_menu_preference_items already exists in ${authDbName}`);
      return;
    }
    
    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'create-user-menu-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log(`🔄 Creating user_menu_preference_items table in ${authDbName}...`);
    await pool.query(sql);
    console.log(`✅ Table created successfully in ${authDbName}!`);
    
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
  } finally {
    await pool.end();
  }
}

createTableInCorrectDB();