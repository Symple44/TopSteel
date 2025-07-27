const { Pool } = require('pg');

async function verifySetup() {
  const authDbName = process.env.DB_AUTH_NAME || 'erp_topsteel_auth';
  
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: authDbName
  });

  try {
    console.log(`🔍 Vérification finale dans ${authDbName}:`);
    
    // Check table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_menu_preference_items'
      );
    `);
    
    console.log(`📋 Table user_menu_preference_items existe: ${tableCheck.rows[0].exists ? '✅' : '❌'}`);
    
    if (tableCheck.rows[0].exists) {
      // Check table structure
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'user_menu_preference_items'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      console.log(`📋 Structure de la table:`);
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      // Check indexes
      const indexes = await pool.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'user_menu_preference_items'
        AND schemaname = 'public';
      `);
      
      console.log(`📋 Index créés:`);
      indexes.rows.forEach(idx => {
        console.log(`  - ${idx.indexname}`);
      });
      
      // Test insert/select
      console.log(`🧪 Test d'insertion/lecture...`);
      
      const testUserId = '00000000-0000-0000-0000-000000000001';
      const testMenuId = '__test_menu__';
      
      // Insert test data
      await pool.query(`
        INSERT INTO user_menu_preference_items (user_id, menu_id, custom_label)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, menu_id) DO UPDATE SET custom_label = EXCLUDED.custom_label
      `, [testUserId, testMenuId, '{"test": "data"}']);
      
      // Read test data
      const result = await pool.query(`
        SELECT * FROM user_menu_preference_items 
        WHERE user_id = $1 AND menu_id = $2
      `, [testUserId, testMenuId]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Test d'insertion/lecture réussi!`);
        console.log(`📄 Données test:`, result.rows[0]);
        
        // Clean up test data
        await pool.query(`
          DELETE FROM user_menu_preference_items 
          WHERE user_id = $1 AND menu_id = $2
        `, [testUserId, testMenuId]);
        console.log(`🧹 Données test supprimées`);
      } else {
        console.log(`❌ Échec du test d'insertion/lecture`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  } finally {
    await pool.end();
  }
}

verifySetup();