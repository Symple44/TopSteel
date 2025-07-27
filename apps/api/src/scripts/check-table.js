const { Pool } = require('pg');

async function checkTable() {
  const databases = ['topsteel_auth', 'erp_topsteel', 'postgres'];
  
  for (const dbName of databases) {
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: dbName
    });

    try {
      console.log(`🔍 Checking database: ${dbName}`);
      
      // List all tables
      const tablesResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);
      
      console.log(`📋 Tables in ${dbName}:`);
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
      
      // Check specifically for user_menu_preference_items
      const userMenuTable = tablesResult.rows.find(row => 
        row.table_name === 'user_menu_preference_items'
      );
      
      if (userMenuTable) {
        console.log(`✅ Found user_menu_preference_items in ${dbName}`);
        
        // Get table structure
        const structureResult = await pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'user_menu_preference_items'
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `);
        
        console.log(`📋 Structure of user_menu_preference_items:`);
        structureResult.rows.forEach(row => {
          console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default || ''}`);
        });
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ Error connecting to ${dbName}: ${error.message}`);
    } finally {
      await pool.end();
    }
  }
}

checkTable();